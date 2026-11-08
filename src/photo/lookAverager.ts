// Live camera: each frame gives a slightly different reading of the face. This
// keeps a steady suggestion: choices (face shape, eyes, brows, nose) by majority
// over recent frames, sizes and colours by a running average. Pure, so tested.
import type { FaceDetail } from '../content/appearance';
import { hex, type PhotoLook } from './faceFromPhoto';

const WINDOW = 24;
/** How much a new frame moves sizes and colours (0–1). */
const SMOOTH = 0.15;

type Rgb = [number, number, number];

function rgbOf(colour: string | undefined): Rgb | null {
  if (!colour || !/^#[0-9a-f]{6}$/i.test(colour)) return null;
  const n = parseInt(colour.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function majority<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  let best: T | undefined;
  let most = 0;
  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > most) {
      most = c;
      best = v;
    }
  }
  return best;
}

export class LookAverager {
  private readonly recent: FaceDetail[] = [];
  private sizes: { eyeSize?: number; eyeGap?: number; mouthWidth?: number } = {};
  private colours: { skin?: Rgb; hair?: Rgb; eye?: Rgb } = {};

  get frames(): number {
    return this.recent.length;
  }

  add(look: PhotoLook): void {
    this.recent.push(look.face);
    if (this.recent.length > WINDOW) this.recent.shift();
    for (const k of ['eyeSize', 'eyeGap', 'mouthWidth'] as const) {
      const v = look.face[k];
      if (v === undefined) continue;
      const old = this.sizes[k];
      this.sizes[k] = old === undefined ? v : old + (v - old) * SMOOTH;
    }
    const mixIn = (key: 'skin' | 'hair' | 'eye', colour: string | undefined) => {
      const c = rgbOf(colour);
      if (!c) return;
      const old = this.colours[key];
      this.colours[key] = old
        ? [
            old[0] + (c[0] - old[0]) * SMOOTH,
            old[1] + (c[1] - old[1]) * SMOOTH,
            old[2] + (c[2] - old[2]) * SMOOTH,
          ]
        : c;
    };
    mixIn('skin', look.skin);
    mixIn('hair', look.hair);
    mixIn('eye', look.face.eyeColour);
  }

  /** The steady suggestion so far, or null before any frame. */
  current(): PhotoLook | null {
    if (this.recent.length === 0) return null;
    const pick = <K extends keyof FaceDetail>(k: K) =>
      majority(this.recent.map((f) => f[k]).filter((v) => v !== undefined));
    const face: FaceDetail = {
      shape: pick('shape'),
      eyes: pick('eyes'),
      brows: pick('brows'),
      nose: pick('nose'),
      ears: true,
      ...this.sizes,
      ...(this.colours.eye ? { eyeColour: hex(this.colours.eye) } : {}),
    };
    return {
      face,
      skin: this.colours.skin ? hex(this.colours.skin) : undefined,
      hair: this.colours.hair ? hex(this.colours.hair) : undefined,
    };
  }

  reset(): void {
    this.recent.length = 0;
    this.sizes = {};
    this.colours = {};
  }
}

/** A live expression from MediaPipe blendshape scores (0–1), for the mirror. */
export interface Expression {
  eyes: 'open' | 'sleep' | 'wow';
  mouth: 'smile' | 'grin' | 'calm';
}

export function expressionOf(scores: ReadonlyMap<string, number>): Expression {
  const s = (name: string) => scores.get(name) ?? 0;
  const blink = (s('eyeBlinkLeft') + s('eyeBlinkRight')) / 2;
  const smile = (s('mouthSmileLeft') + s('mouthSmileRight')) / 2;
  const open = s('jawOpen');
  return {
    eyes: open > 0.35 ? 'wow' : blink > 0.5 ? 'sleep' : 'open',
    mouth: smile > 0.45 ? 'grin' : smile > 0.15 ? 'smile' : 'calm',
  };
}
