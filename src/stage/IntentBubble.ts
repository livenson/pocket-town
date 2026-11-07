// Bubbles above a character (SIM.md → Legibility):
// - intent: white circle with the activity icon and an optional progress ring;
// - thought cloud: a wish, picture only;
// - emote: chatting, in turns.
import { Container, Graphics } from 'pixi.js';
import type { IconName } from '../design/icons';
import { hex } from './draw';
import { iconGraphics } from './iconGraphics';

const R = 27;
const RING = 5;
const SHADOW = { color: 0x2a1640, alpha: 0.18 };

type Shape = 'circle' | 'cloud';

export class IntentBubble extends Container {
  private readonly base = new Graphics();
  private readonly ring = new Graphics();
  private icon: Graphics | null = null;
  private key = '';
  private shape: Shape | null = null;
  private accent = '#2A1640';
  private progress: number | null = null;

  constructor() {
    super();
    this.addChild(this.base, this.ring);
    this.visible = false;
  }

  private setShape(shape: Shape): void {
    if (shape === this.shape) return;
    this.shape = shape;
    this.base.clear();
    if (shape === 'circle') {
      this.base.circle(0, 4, R).fill(SHADOW).circle(0, 0, R).fill(0xffffff);
    } else {
      // A cloud: a rounded body with two small puffs trailing down towards the head.
      this.base
        .roundRect(-37, -27 + 4, 74, 58, 29)
        .fill(SHADOW)
        .roundRect(-37, -27, 74, 58, 29)
        .fill(0xffffff)
        .circle(-6, 40, 8)
        .fill(0xffffff)
        .circle(-14, 54, 5)
        .fill(0xffffff);
    }
  }

  private setIcon(icon: IconName, color: string): void {
    const key = `${icon}:${color}`;
    if (key === this.key) return;
    this.icon?.destroy();
    this.icon = iconGraphics(icon, { size: 30, color });
    this.addChild(this.icon);
    this.key = key;
    this.accent = color;
    this.progress = -1; // force a ring redraw in the new colour
  }

  /** Activity icon with an optional 0–1 progress ring. */
  show(icon: IconName, color: string, progress: number | null = null): void {
    this.setShape('circle');
    this.setIcon(icon, color);
    this.setProgress(progress);
    this.visible = true;
  }

  /** A wish: picture only, in a thought cloud. */
  showCloud(icon: IconName, color: string): void {
    this.setShape('cloud');
    this.setIcon(icon, color);
    this.setProgress(null);
    this.visible = true;
  }

  setProgress(progress: number | null): void {
    if (progress === this.progress) return;
    this.progress = progress;
    this.ring.clear();
    if (progress === null || progress < 0) return;
    const p = Math.max(0, Math.min(1, progress));
    const r = R - RING / 2;
    this.ring.circle(0, 0, r).stroke({ width: RING, color: 0xf3d9c4 });
    if (p > 0) {
      this.ring
        .moveTo(0, -r)
        .arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
        .stroke({ width: RING, color: hex(this.accent), cap: 'round' });
    }
  }

  hide(): void {
    this.visible = false;
  }
}
