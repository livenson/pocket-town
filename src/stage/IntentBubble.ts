// Intent bubble above a character: white circle, soft drop shadow, activity icon
// and an optional progress ring that fills as the activity finishes (SIM.md → Legibility).
import { Container, Graphics } from 'pixi.js';
import type { IconName } from '../design/icons';
import { hex } from './draw';
import { iconGraphics } from './iconGraphics';

const R = 27;
const RING = 5;

export class IntentBubble extends Container {
  private readonly ring = new Graphics();
  private icon: Graphics | null = null;
  private iconName: IconName | null = null;
  private accent = '#2A1640';
  private progress: number | null = null;

  constructor() {
    super();
    const base = new Graphics()
      .circle(0, 4, R)
      .fill({ color: 0x2a1640, alpha: 0.18 })
      .circle(0, 0, R)
      .fill(0xffffff);
    this.addChild(base, this.ring);
    this.visible = false;
  }

  /** Show an icon (in its activity colour) with an optional 0–1 progress ring. */
  show(icon: IconName, color: string, progress: number | null = null): void {
    if (icon !== this.iconName || color !== this.accent) {
      this.icon?.destroy();
      this.icon = iconGraphics(icon, { size: 30, color });
      this.addChild(this.icon);
      this.iconName = icon;
      this.accent = color;
    }
    this.setProgress(progress);
    this.visible = true;
  }

  setProgress(progress: number | null): void {
    if (progress === this.progress) return;
    this.progress = progress;
    this.ring.clear();
    if (progress === null) return;
    const p = Math.max(0, Math.min(1, progress));
    this.ring.circle(0, 0, R - RING / 2).stroke({ width: RING, color: 0xf3d9c4 });
    if (p > 0) {
      const r = R - RING / 2;
      this.ring
        .moveTo(0, -r)
        .arc(0, 0, R - RING / 2, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
        .stroke({ width: RING, color: hex(this.accent), cap: 'round' });
    }
  }

  hide(): void {
    this.visible = false;
  }
}
