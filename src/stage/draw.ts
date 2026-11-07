// Small drawing helpers on top of Pixi Graphics.
import type { Graphics } from 'pixi.js';
import type { Box, Corners } from './peg/geometry';

const K = 0.5523; // bezier constant for quarter ellipses

/** Rectangle with CSS-style elliptical corners (tl, tr, br, bl), clamped to the box. */
export function ellipticalRect(g: Graphics, b: Box, c: Corners, dx = 0, dy = 0): Graphics {
  const x = b.x + dx;
  const y = b.y + dy;
  const { w, h } = b;
  // CSS scales radii down when they overlap.
  const f = Math.min(
    1,
    w / (c.rx[0] + c.rx[1] || 1),
    w / (c.rx[3] + c.rx[2] || 1),
    h / (c.ry[0] + c.ry[3] || 1),
    h / (c.ry[1] + c.ry[2] || 1),
  );
  const rx = c.rx.map((r) => r * f);
  const ry = c.ry.map((r) => r * f);
  const [tlx = 0, trx = 0, brx = 0, blx = 0] = rx;
  const [tly = 0, try_ = 0, bry = 0, bly = 0] = ry;
  g.moveTo(x + tlx, y);
  g.lineTo(x + w - trx, y);
  g.bezierCurveTo(x + w - trx + trx * K, y, x + w, y + try_ - try_ * K, x + w, y + try_);
  g.lineTo(x + w, y + h - bry);
  g.bezierCurveTo(x + w, y + h - bry + bry * K, x + w - brx + brx * K, y + h, x + w - brx, y + h);
  g.lineTo(x + blx, y + h);
  g.bezierCurveTo(x + blx - blx * K, y + h, x, y + h - bly + bly * K, x, y + h - bly);
  g.lineTo(x, y + tly);
  g.bezierCurveTo(x, y + tly - tly * K, x + tlx - tlx * K, y, x + tlx, y);
  g.closePath();
  return g;
}

/** Uniform elliptical corners as a fraction of width/height (CSS "40%"). */
export function pctCorners(b: Box, px: number, py = px): Corners {
  return {
    rx: [px * b.w, px * b.w, px * b.w, px * b.w],
    ry: [py * b.h, py * b.h, py * b.h, py * b.h],
  };
}

export function ellipseBox(g: Graphics, b: Box): Graphics {
  return g.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2);
}

/** Hex "#RRGGBB" to a number Pixi accepts. */
export function hex(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}
