// Colours shared by the figure (rig.ts), and the head's lashes, hair shine and space
// helmet, as simple shapes (see extras.ts), so the Pixi stage and the SVG portraits
// draw the same figure.
import type { Appearance } from '../../content/appearance';
import { color } from '../../design/tokens';
import type { Prim } from './extras';
import type { PegGeometry } from './geometry';

export const SUIT = '#EEF1F7';
export const SUIT_SHADE = '#C9D1E3';
export const SHOE = '#3B2A50';

const rgb = (c: string) => parseInt(c.replace('#', '').slice(0, 6), 16);

/** Blend two #rrggbb colours: t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  const ch = (shift: number) =>
    Math.round(((x >> shift) & 255) * (1 - t) + ((y >> shift) & 255) * t);
  const v = (ch(16) << 16) | (ch(8) << 8) | ch(0);
  return `#${v.toString(16).padStart(6, '0')}`;
}

/** Girls' eyelashes: two short flicks from the outer edge of each open eye. */
export function lashPrims(g: PegGeometry): Prim[] {
  if (g.figure !== 'girl' || g.eyeShape === 'bar') return [];
  const [l, r] = g.eyes;
  const sw = Math.max(1.4, g.lineWidth * 0.6);
  const len = l.w * 0.75;
  const flicks = (x: number, y: number, dir: -1 | 1): Prim[] => [
    {
      t: 'line',
      x1: x,
      y1: y + l.h * 0.15,
      x2: x + dir * len,
      y2: y - len * 0.05,
      stroke: color.ink,
      sw,
    },
    { t: 'line', x1: x, y1: y, x2: x + dir * len * 0.8, y2: y - len * 0.6, stroke: color.ink, sw },
  ];
  return [
    ...flicks(l.x + l.w * 0.1, l.y + l.h * 0.2, -1),
    ...flicks(r.x + r.w * 0.9, r.y + r.h * 0.2, 1),
  ];
}

/** A glass bubble helmet with a little antenna, over everything (space suit). */
export function helmetPrims(g: PegGeometry, a: Appearance): Prim[] {
  if (g.clothes !== 'space') return [];
  const hr = g.d / 2;
  const cx = g.head.x + hr;
  const cy = g.head.y + hr;
  const R = hr * 1.26;
  return [
    {
      t: 'line',
      x1: cx + R * 0.45,
      y1: cy - R * 0.85,
      x2: cx + R * 0.62,
      y2: cy - R * 1.22,
      stroke: SUIT_SHADE,
      sw: Math.max(2, g.lineWidth),
    },
    {
      t: 'ellipse',
      cx: cx + R * 0.62,
      cy: cy - R * 1.22,
      rx: R * 0.1,
      ry: R * 0.1,
      fill: a.outfit,
    },
    { t: 'ellipse', cx, cy, rx: R, ry: R * 0.98, fill: color.sky, alpha: 0.22 },
    {
      t: 'ellipse',
      cx,
      cy,
      rx: R,
      ry: R * 0.98,
      stroke: '#FFFFFF',
      sw: Math.max(2.5, g.lineWidth * 1.4),
    },
    {
      t: 'ellipse',
      cx: cx - R * 0.45,
      cy: cy - R * 0.5,
      rx: R * 0.16,
      ry: R * 0.26,
      fill: '#FFFFFF',
      alpha: 0.55,
    },
  ];
}

/** A soft shine across the top of the hair. */
export function hairShinePrims(g: PegGeometry): Prim[] {
  if (!g.cap || g.kind !== 'person') return [];
  const c = g.cap;
  return [
    {
      t: 'ellipse',
      cx: c.x + c.w * 0.36,
      cy: c.y + c.h * 0.3,
      rx: c.w * 0.16,
      ry: c.h * 0.12,
      fill: '#FFFFFF',
      alpha: 0.22,
    },
  ];
}
