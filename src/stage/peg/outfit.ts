// Arms, legs, clothes, lashes and the space helmet on a peg-folk character, as
// simple shapes (see extras.ts), so the Pixi stage and the SVG portraits draw the
// same figure. Drawing order, back to front:
//   backPrims → body → clothesPrims → patterns → armPrims → head → lashes, extras → helmetPrims
import { DEFAULT_SECOND, type Appearance } from '../../content/appearance';
import { color } from '../../design/tokens';
import type { Prim } from './extras';
import type { PegGeometry } from './geometry';

const SUIT = '#EEF1F7';
const SUIT_SHADE = '#C9D1E3';
const SHOE = '#3B2A50';

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

/** The body's colour: the outfit, or the white of a space suit. */
export function bodyFill(g: PegGeometry, a: Appearance): string {
  return g.clothes === 'space' ? SUIT : a.outfit;
}

const second = (a: Appearance) => a.second ?? DEFAULT_SECOND;

/** Behind the body: cape or space backpack, then legs and shoes (or paws). */
export function backPrims(g: PegGeometry, a: Appearance): Prim[] {
  const { W, H, body, legs, shoeH } = g;
  const out: Prim[] = [];
  const bottom = body.y + body.h;
  if (g.clothes === 'cape') {
    // A cape that stands up behind the neck and flares wide, down to the shoes.
    const fill = a.second ?? color.tomato;
    const top = body.y - body.h * 0.1;
    const hem = H - shoeH * 1.1;
    out.push({
      t: 'poly',
      pts: [-W * 0.02, top, W * 1.02, top, W * 1.32, hem, -W * 0.32, hem],
      fill,
    });
    out.push({
      t: 'poly',
      pts: [W * 1.02, top, W * 1.32, hem, W * 0.98, hem],
      fill: color.ink,
      alpha: 0.2,
    });
    out.push({
      t: 'poly',
      pts: [W * 0.1, top, -W * 0.14, hem, -W * 0.24, hem],
      fill: color.ink,
      alpha: 0.1,
    });
  }
  if (g.clothes === 'space') {
    out.push({
      t: 'rect',
      x: -W * 0.07,
      y: body.y + body.h * 0.14,
      w: W * 1.14,
      h: body.h * 0.6,
      r: W * 0.1,
      fill: SUIT_SHADE,
    });
  }
  const animal = g.kind !== 'person';
  // Legs: what covers them depends on the clothes.
  const legFill =
    g.clothes === 'space'
      ? SUIT
      : g.clothes === 'pants' || g.clothes === 'overalls'
        ? second(a)
        : a.skin;
  for (const l of legs) {
    out.push({ t: 'rect', x: l.x, y: l.y, w: l.w, h: l.h, r: l.w * 0.4, fill: legFill });
    if (g.clothes === 'shorts')
      out.push({
        t: 'rect',
        x: l.x - 1,
        y: l.y,
        w: l.w + 2,
        h: bottom - l.y + l.h * 0.35,
        r: l.w * 0.3,
        fill: second(a),
      });
    // A soft shade on the inner edge, so the two legs read apart.
    out.push({
      t: 'rect',
      x: l.x + l.w * 0.62,
      y: l.y,
      w: l.w * 0.38,
      h: l.h,
      r: l.w * 0.19,
      fill: color.ink,
      alpha: 0.1,
    });
  }
  // Shoes point outwards a little; animals have round paws in their fur colour.
  const [l, r] = legs;
  const shoeFill = animal ? mix(a.skin, color.ink, 0.2) : g.clothes === 'space' ? SUIT_SHADE : SHOE;
  const ry = shoeH * (g.clothes === 'space' ? 0.62 : 0.5);
  const rx = l.w * (g.clothes === 'space' ? 0.85 : 0.72);
  const cy = H - ry;
  out.push({ t: 'ellipse', cx: l.x + l.w / 2 - l.w * 0.18, cy, rx, ry, fill: shoeFill });
  out.push({ t: 'ellipse', cx: r.x + r.w / 2 + r.w * 0.18, cy, rx, ry, fill: shoeFill });
  if (!animal && g.clothes !== 'space') {
    // A shine on each shoe.
    out.push({
      t: 'ellipse',
      cx: l.x + l.w * 0.2,
      cy: cy - ry * 0.35,
      rx: rx * 0.3,
      ry: ry * 0.25,
      fill: '#FFFFFF',
      alpha: 0.35,
    });
    out.push({
      t: 'ellipse',
      cx: r.x + r.w * 0.55,
      cy: cy - ry * 0.35,
      rx: rx * 0.3,
      ry: ry * 0.25,
      fill: '#FFFFFF',
      alpha: 0.35,
    });
  }
  return out;
}

/** Over the body: skirt, dungarees, space-suit details, cape clasp. */
export function clothesPrims(g: PegGeometry, a: Appearance): Prim[] {
  const { W, body, legs } = g;
  const out: Prim[] = [];
  const bottom = body.y + body.h;
  const legBottom = legs[0].y + legs[0].h;
  if (g.clothes === 'dress') {
    // A-line skirt from the waist, flaring past the body, over the knees.
    const waist = body.y + body.h * 0.5;
    const hem = bottom + (legBottom - bottom) * 0.42;
    out.push({
      t: 'poly',
      pts: [W * 0.06, waist, W * 0.94, waist, W * 1.06, hem, -W * 0.06, hem],
      fill: a.outfit,
    });
    out.push({
      t: 'poly',
      pts: [W * 0.78, waist, W * 0.94, waist, W * 1.06, hem, W * 0.86, hem],
      fill: color.ink,
      alpha: 0.12,
    });
    out.push({
      t: 'rect',
      x: -W * 0.06,
      y: hem - body.h * 0.12,
      w: W * 1.12,
      h: body.h * 0.12,
      r: 2,
      fill: color.ink,
      alpha: 0.16,
    });
    out.push({
      t: 'rect',
      x: W * 0.06,
      y: waist - body.h * 0.05,
      w: W * 0.88,
      h: body.h * 0.1,
      r: 2,
      fill: a.accent ?? '#FFF8F0',
      alpha: 0.9,
    });
  } else if (g.clothes === 'overalls') {
    const fill = second(a);
    const bibTop = body.y + body.h * 0.34;
    const hip = body.y + body.h * 0.62;
    out.push({ t: 'rect', x: 0, y: hip, w: W, h: bottom - hip, r: W * 0.1, fill });
    out.push({ t: 'rect', x: W * 0.27, y: bibTop, w: W * 0.46, h: hip - bibTop + 4, r: 4, fill });
    out.push({
      t: 'line',
      x1: W * 0.31,
      y1: bibTop + 2,
      x2: W * 0.16,
      y2: body.y + body.h * 0.06,
      stroke: fill,
      sw: W * 0.07,
    });
    out.push({
      t: 'line',
      x1: W * 0.69,
      y1: bibTop + 2,
      x2: W * 0.84,
      y2: body.y + body.h * 0.06,
      stroke: fill,
      sw: W * 0.07,
    });
    for (const fx of [0.34, 0.66])
      out.push({
        t: 'ellipse',
        cx: W * fx,
        cy: bibTop + body.h * 0.07,
        rx: W * 0.04,
        ry: W * 0.04,
        fill: color.marigold,
      });
    out.push({
      t: 'rect',
      x: W * 0.4,
      y: bibTop + body.h * 0.14,
      w: W * 0.2,
      h: body.h * 0.12,
      r: 2,
      fill: color.ink,
      alpha: 0.15,
    });
  } else if (g.clothes === 'pants' || g.clothes === 'shorts') {
    // The shirt tucks into a belt.
    out.push({
      t: 'rect',
      x: W * 0.02,
      y: bottom - body.h * 0.14,
      w: W * 0.96,
      h: body.h * 0.14,
      r: W * 0.06,
      fill: second(a),
    });
    out.push({
      t: 'rect',
      x: W * 0.42,
      y: bottom - body.h * 0.12,
      w: W * 0.16,
      h: body.h * 0.1,
      r: 2,
      fill: color.marigold,
    });
  } else if (g.clothes === 'space') {
    const trim = a.outfit;
    out.push({
      t: 'rect',
      x: W * 0.2,
      y: body.y - body.h * 0.02,
      w: W * 0.6,
      h: body.h * 0.12,
      r: body.h * 0.06,
      fill: SUIT_SHADE,
    });
    out.push({
      t: 'rect',
      x: W * 0.28,
      y: body.y + body.h * 0.3,
      w: W * 0.44,
      h: body.h * 0.28,
      r: 4,
      fill: trim,
    });
    const by = body.y + body.h * 0.44;
    for (const [fx, c] of [
      [0.37, color.tomato],
      [0.5, color.marigold],
      [0.63, color.teal],
    ] as const)
      out.push({ t: 'ellipse', cx: W * fx, cy: by, rx: W * 0.045, ry: W * 0.045, fill: c });
    out.push({
      t: 'rect',
      x: 0,
      y: bottom - body.h * 0.2,
      w: W,
      h: body.h * 0.12,
      r: 2,
      fill: trim,
    });
    out.push({
      t: 'ellipse',
      cx: W * 0.84,
      cy: body.y + body.h * 0.24,
      rx: W * 0.07,
      ry: W * 0.07,
      fill: trim,
    });
  } else if (g.clothes === 'cape') {
    out.push({
      t: 'ellipse',
      cx: W * 0.5,
      cy: body.y + body.h * 0.08,
      rx: W * 0.08,
      ry: W * 0.06,
      fill: color.marigold,
    });
    out.push({
      t: 'rect',
      x: 0,
      y: bottom - body.h * 0.22,
      w: W,
      h: body.h * 0.12,
      r: 2,
      fill: a.second ?? color.tomato,
    });
    // A round emblem on the chest.
    const ey = body.y + body.h * 0.44;
    out.push({
      t: 'ellipse',
      cx: W * 0.5,
      cy: ey,
      rx: W * 0.14,
      ry: W * 0.14,
      fill: color.marigold,
    });
    out.push({
      t: 'ellipse',
      cx: W * 0.5,
      cy: ey,
      rx: W * 0.07,
      ry: W * 0.07,
      fill: a.second ?? color.tomato,
    });
  }
  return out;
}

/** Arms in sleeves, with hands (gloves in space, paws for animals). */
export function armPrims(g: PegGeometry, a: Appearance): Prim[] {
  const { W, body } = g;
  const sleeve = mix(bodyFill(g, a), color.ink, 0.14);
  const hand = g.clothes === 'space' ? SUIT_SHADE : a.skin;
  const sw = W * 0.15;
  const sy = body.y + body.h * 0.2;
  const hy = body.y + body.h * 0.66;
  const out: Prim[] = [];
  for (const [sx, hx] of [
    [W * 0.13, -W * 0.03],
    [W * 0.87, W * 1.03],
  ] as const) {
    out.push({ t: 'line', x1: sx, y1: sy, x2: hx, y2: hy, stroke: sleeve, sw });
    if (g.clothes === 'space')
      out.push({
        t: 'ellipse',
        cx: hx,
        cy: hy - sw * 0.25,
        rx: sw * 0.6,
        ry: sw * 0.3,
        fill: a.outfit,
      });
    out.push({ t: 'ellipse', cx: hx, cy: hy + sw * 0.35, rx: sw * 0.52, ry: sw * 0.5, fill: hand });
  }
  return out;
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

/**
 * Small finishing details that make a character less plain: a neckline, a pocket
 * on tunics and dresses, button rows on shirts. Drawn after the clothes.
 */
export function detailPrims(g: PegGeometry, a: Appearance): Prim[] {
  if (g.clothes === 'space' || g.kind !== 'person') return [];
  const { W, body } = g;
  const out: Prim[] = [
    // The neck shows above the neckline.
    {
      t: 'ellipse',
      cx: W / 2,
      cy: body.y + body.h * 0.04,
      rx: W * 0.13,
      ry: body.h * 0.08,
      fill: mix(a.skin, color.ink, 0.12),
    },
  ];
  if (g.clothes === 'tunic' || g.clothes === 'dress') {
    out.push({
      t: 'rect',
      x: W * 0.6,
      y: body.y + body.h * 0.38,
      w: W * 0.17,
      h: body.h * 0.16,
      r: 3,
      fill: color.ink,
      alpha: 0.12,
    });
    out.push({
      t: 'rect',
      x: W * 0.6,
      y: body.y + body.h * 0.38,
      w: W * 0.17,
      h: body.h * 0.04,
      r: 2,
      fill: color.ink,
      alpha: 0.18,
    });
  }
  if (g.clothes === 'pants' || g.clothes === 'shorts') {
    for (const f of [0.3, 0.46, 0.62])
      out.push({
        t: 'ellipse',
        cx: W / 2,
        cy: body.y + body.h * f,
        rx: W * 0.025,
        ry: W * 0.025,
        fill: color.ink,
        alpha: 0.3,
      });
  }
  return out;
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
