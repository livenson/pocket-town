// The live mirror: turns MediaPipe's blendshape scores and face points into a
// continuous expression for the preview character. Calibrated to the child's own
// resting face (measured over the first frames) and amplified, so small real
// expressions still move the character. Pure, so it is unit-tested.

/** How the character's face moves right now. All values are continuous. */
export interface LiveFace {
  /** 0 open … 1 closed, per eye (left and right as seen on screen, like a mirror). */
  blinkL: number;
  blinkR: number;
  /** -1 knitted down … 1 raised, per brow. */
  browL: number;
  browR: number;
  /** -1 frown … 1 big smile. */
  smile: number;
  /** 0 closed … 1 wide open. */
  open: number;
  /** 0 … 1 lips pushed forward ("ooh"). */
  pucker: number;
  /** 0 … 1 puffed cheeks. */
  puff: number;
  /** Head tilt in radians (clockwise on screen), and turn -1 … 1. */
  roll: number;
  yaw: number;
}

const FACE_KEYS = [
  'blinkL',
  'blinkR',
  'browL',
  'browR',
  'smile',
  'open',
  'pucker',
  'puff',
  'roll',
  'yaw',
] as const satisfies readonly (keyof LiveFace)[];

export const restingFace: LiveFace = {
  blinkL: 0,
  blinkR: 0,
  browL: 0,
  browR: 0,
  smile: 0.15,
  open: 0,
  pucker: 0,
  puff: 0,
  roll: 0,
  yaw: 0,
};

export interface Pt2 {
  x: number;
  y: number;
}

/** Frames used to learn the resting face. */
const CALIBRATION_FRAMES = 20;
/** Small real movements are amplified this much. */
const GAIN = 1.6;
/** How much each frame moves the shown expression (0–1): smooth but quick. */
const FOLLOW = 0.55;

const NAMES = [
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  'browDownLeft',
  'browDownRight',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'jawOpen',
  'mouthPucker',
  'mouthFunnel',
  'cheekPuff',
] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Head tilt and turn from face points (MediaPipe's normalised landmarks), as seen
 * in the mirrored camera view.
 */
export function poseOf(points: readonly Pt2[]): { roll: number; yaw: number } {
  const outerL = points[33];
  const outerR = points[263];
  const nose = points[1];
  const cheekL = points[234];
  const cheekR = points[454];
  if (!outerL || !outerR || !nose || !cheekL || !cheekR) return { roll: 0, yaw: 0 };
  // The camera picture is shown mirrored, so tilt and turn flip.
  const roll = -Math.atan2(outerR.y - outerL.y, outerR.x - outerL.x);
  const mid = (cheekL.x + cheekR.x) / 2;
  const half = Math.abs(cheekR.x - cheekL.x) / 2 || 1;
  const yaw = -clamp((nose.x - mid) / half, -1, 1);
  return { roll: clamp(roll, -0.6, 0.6), yaw };
}

export class ExpressionReader {
  private readonly base = new Map<string, number>();
  private frames = 0;
  private shown: LiveFace = { ...restingFace };

  /** True once the resting face has been learned. */
  get calibrated(): boolean {
    return this.frames >= CALIBRATION_FRAMES;
  }

  reset(): void {
    this.base.clear();
    this.frames = 0;
    this.shown = { ...restingFace };
  }

  /** Feed one frame; returns the expression to show. */
  read(scores: ReadonlyMap<string, number>, points: readonly Pt2[] | null): LiveFace {
    const raw = (n: string) => scores.get(n) ?? 0;
    // Only frames with a face teach the resting face (not warm-up or empty frames).
    if (points && this.frames < CALIBRATION_FRAMES) {
      // Learn the resting face as a running average of the first frames.
      for (const n of NAMES) {
        const old = this.base.get(n) ?? raw(n);
        this.base.set(n, old + (raw(n) - old) / (this.frames + 1));
      }
      this.frames++;
    }
    // How far from rest, scaled so the room left above rest maps to 0…1.
    const v = (n: string) => {
      const b = this.base.get(n) ?? 0;
      return clamp(((raw(n) - b) / Math.max(0.25, 1 - b)) * GAIN, 0, 1);
    };
    const pose = points ? poseOf(points) : { roll: 0, yaw: 0 };
    // Mirror: the child's left eye (MediaPipe "Left") shows on the screen's left.
    const target: LiveFace = {
      blinkL: v('eyeBlinkLeft'),
      blinkR: v('eyeBlinkRight'),
      browL: clamp(v('browInnerUp') * 0.6 + v('browOuterUpLeft') - v('browDownLeft'), -1, 1),
      browR: clamp(v('browInnerUp') * 0.6 + v('browOuterUpRight') - v('browDownRight'), -1, 1),
      smile: clamp(
        0.15 +
          (v('mouthSmileLeft') + v('mouthSmileRight')) / 2 -
          (v('mouthFrownLeft') + v('mouthFrownRight')) / 2,
        -1,
        1,
      ),
      open: v('jawOpen'),
      pucker: Math.max(v('mouthPucker'), v('mouthFunnel')),
      puff: v('cheekPuff'),
      roll: pose.roll,
      yaw: pose.yaw,
    };
    const next = { ...this.shown };
    for (const k of FACE_KEYS) next[k] = this.shown[k] + (target[k] - this.shown[k]) * FOLLOW;
    this.shown = next;
    return next;
  }
}
