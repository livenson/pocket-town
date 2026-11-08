// Draw a peg-folk character into a Graphics, following design-reference/Peg.dc.html.
import { Graphics } from 'pixi.js';
import { color } from '../../design/tokens';
import { ellipseBox, ellipticalRect, hex } from '../draw';
import type { Appearance, Box, Eyes, PegGeometry } from './geometry';
import { pegGeometry } from './geometry';
import { bodyExtras, headExtras, mouthPrims, type Prim } from './extras';
import { armPrims, backPrims, bodyFill, clothesPrims, helmetPrims, lashPrims } from './outfit';

const INK = hex(color.ink);

export function drawPeg(
  size: number,
  a: Appearance,
  eyes: Eyes = 'open',
): { g: Graphics; geo: PegGeometry } {
  const geo = pegGeometry(size, a, eyes);
  const g = new Graphics();
  const { W, d, body, bodyCorners } = geo;

  // Behind the body: hair puff or bun.
  if (geo.top) ellipseBox(g, geo.top).fill(hex(a.hair));

  // Behind the body: cape or backpack, legs and shoes.
  drawPrims(g, backPrims(geo, a));

  // Body (felt outfit) with a light inset on the left and a darker one on the right.
  ellipticalRect(g, body, bodyCorners).fill(hex(bodyFill(geo, a)));
  ellipticalRect(g, body, bodyCorners).fill({ color: 0xffffff, alpha: 0.2 });
  ellipticalRect(g, body, bodyCorners, W * 0.09, 0).cut();
  ellipticalRect(g, body, bodyCorners).fill({ color: INK, alpha: 0.12 });
  ellipticalRect(g, body, bodyCorners, -W * 0.08, 0).cut();
  g.roundRect(geo.band.x, geo.band.y, geo.band.w, geo.band.h, geo.band.h / 2).fill({
    color: INK,
    alpha: 0.22,
  });
  drawPrims(g, clothesPrims(geo, a));
  drawPrims(g, bodyExtras(geo, a));
  drawPrims(g, armPrims(geo, a));

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
  drawPrims(g, lashPrims(geo));
  for (const c of geo.cheeks) ellipseBox(g, c).fill({ color: 0xff6978, alpha: 0.42 });
  const mouth = mouthPrims(geo);
  if (mouth) drawPrims(g, mouth);
  else drawMouth(g, geo.mouth, geo.mouthShape, geo.lineWidth);

  drawPrims(g, headExtras(geo, a));
  drawPrims(g, helmetPrims(geo, a));
  return { g, geo };
}

function drawPrims(g: Graphics, prims: Prim[]): void {
  for (const p of prims) {
    if (p.t === 'rect')
      g.roundRect(p.x, p.y, p.w, p.h, p.r).fill({ color: hex(p.fill), alpha: p.alpha ?? 1 });
    else if (p.t === 'poly') g.poly(p.pts).fill({ color: hex(p.fill), alpha: p.alpha ?? 1 });
    else if (p.t === 'line')
      g.moveTo(p.x1, p.y1)
        .lineTo(p.x2, p.y2)
        .stroke({ width: p.sw, color: hex(p.stroke), cap: 'round' });
    else {
      g.ellipse(p.cx, p.cy, p.rx, p.ry);
      if (p.fill) g.fill({ color: hex(p.fill), alpha: p.alpha ?? 1 });
      if (p.stroke) g.stroke({ width: p.sw ?? 2, color: hex(p.stroke) });
    }
  }
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
