// Draw a peg-folk character into a Graphics, following design-reference/Peg.dc.html.
import { Graphics } from 'pixi.js';
import { color } from '../../design/tokens';
import { ellipseBox, ellipticalRect, hex, pctCorners } from '../draw';
import type { Appearance, Box, Eyes, PegGeometry } from './geometry';
import { pegGeometry } from './geometry';

const INK = hex(color.ink);

export function drawPeg(
  size: number,
  a: Appearance,
  eyes: Eyes = 'open',
): { g: Graphics; geo: PegGeometry } {
  const geo = pegGeometry(size, a, eyes);
  const g = new Graphics();
  const { W, d, body, bodyCorners } = geo;
  const thin = Math.max(1.5, d * 0.03);
  const wc = geo.wheelchair;

  // Behind the body: wheelchair push handle, hair puff or bun.
  if (wc) g.roundRect(wc.handle.x, wc.handle.y, wc.handle.w, wc.handle.h, size * 0.03).fill(INK);
  if (geo.top) ellipseBox(g, geo.top).fill(hex(a.hair));

  // Body (felt outfit) with a light inset on the left and a darker one on the right.
  ellipticalRect(g, body, bodyCorners).fill(hex(a.outfit));
  ellipticalRect(g, body, bodyCorners).fill({ color: 0xffffff, alpha: 0.2 });
  ellipticalRect(g, body, bodyCorners, W * 0.09, 0).cut();
  ellipticalRect(g, body, bodyCorners).fill({ color: INK, alpha: 0.12 });
  ellipticalRect(g, body, bodyCorners, -W * 0.08, 0).cut();
  g.roundRect(geo.band.x, geo.band.y, geo.band.w, geo.band.h, geo.band.h / 2).fill({
    color: INK,
    alpha: 0.22,
  });

  if (geo.arm) {
    ellipticalRect(g, geo.arm, pctCorners(geo.arm, 0.45, 0.2))
      .fill(0xa9b3c6)
      .stroke({ width: thin, color: INK });
  }

  if (wc) {
    const r = wc.wheel.w / 2;
    const cx = wc.wheel.x + r;
    const cy = wc.wheel.y + r;
    g.circle(cx, cy, r - wc.wheelBorder / 2)
      .fill({ color: 0xffffff, alpha: 0.28 })
      .stroke({ width: wc.wheelBorder, color: INK });
    ellipseBox(g, wc.hub).fill(INK);
    ellipseBox(g, wc.caster).fill(INK);
  }

  // Head with a soft shade at the bottom-right.
  const hr = d / 2;
  const hcx = geo.head.x + hr;
  const hcy = geo.head.y + hr;
  g.circle(hcx, hcy, hr).fill(hex(a.skin));
  g.circle(hcx, hcy, hr).fill({ color: INK, alpha: 0.12 });
  g.circle(hcx - d * 0.07, hcy - d * 0.06, hr).cut();

  // Hair.
  if (geo.cap) ellipticalRect(g, geo.cap, geo.capCorners).fill(hex(a.hair));
  if (geo.locks) {
    const [l, r] = geo.locks;
    ellipticalRect(g, l, {
      rx: [0.4 * l.w, 0.3 * l.w, 0.5 * l.w, 0.5 * l.w],
      ry: [0.4 * l.h, 0.3 * l.h, 0.5 * l.h, 0.5 * l.h],
    }).fill(hex(a.hair));
    ellipticalRect(g, r, {
      rx: [0.3 * r.w, 0.4 * r.w, 0.5 * r.w, 0.5 * r.w],
      ry: [0.3 * r.h, 0.4 * r.h, 0.5 * r.h, 0.5 * r.h],
    }).fill(hex(a.hair));
  }

  // Face.
  for (const e of geo.eyes) {
    if (geo.eyeShape === 'bar') g.roundRect(e.x, e.y, e.w, e.h, Math.min(3, e.h / 2)).fill(INK);
    else ellipseBox(g, e).fill(INK);
  }
  for (const c of geo.cheeks) ellipseBox(g, c).fill({ color: 0xff6978, alpha: 0.42 });
  drawMouth(g, geo.mouth, geo.mouthShape, geo.lineWidth);

  if (geo.hear) {
    ellipticalRect(g, geo.hear, pctCorners(geo.hear, 0.4))
      .fill(hex(color.teal))
      .stroke({ width: thin, color: 0xffffff });
  }

  return { g, geo };
}

function drawMouth(g: Graphics, m: Box, shape: 'smile' | 'o', width: number): void {
  if (shape === 'o') {
    const lw = Math.max(2, width * 0.9);
    g.ellipse(m.x + m.w / 2, m.y + m.h / 2, m.w / 2 - lw / 2, m.h / 2 - lw / 2).stroke({
      width: lw,
      color: INK,
    });
    return;
  }
  const y = m.y + m.h * 0.35;
  g.moveTo(m.x, y)
    .bezierCurveTo(m.x, y + m.h * 1.1, m.x + m.w, y + m.h * 1.1, m.x + m.w, y)
    .stroke({ width, color: INK, cap: 'round' });
}
