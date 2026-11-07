// Build a Pixi Graphics from the same icon path data the DOM <Icon> uses.
import { Graphics } from 'pixi.js';
import { ICON_STROKE, icons, type IconName } from '../design/icons';
import { color as palette } from '../design/tokens';

export interface IconGraphicsOptions {
  /** Rendered size in stage units (icons are square). */
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function iconSvg(name: IconName, color: string, strokeWidth: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<path d="${icons[name]}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
}

/** A Graphics drawing of the icon, centred on (0, 0). */
export function iconGraphics(name: IconName, options: IconGraphicsOptions = {}): Graphics {
  const { size = 32, color = palette.ink, strokeWidth = ICON_STROKE } = options;
  const g = new Graphics().svg(iconSvg(name, color, strokeWidth));
  g.pivot.set(16, 16);
  g.scale.set(size / 32);
  return g;
}
