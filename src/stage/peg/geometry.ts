// Peg-folk geometry, ported from design-reference/Peg.dc.html (renderVals). Pure
// numbers, no Pixi, so it can be unit-tested. Coordinates: origin top-left of the
// peg's box; the feet are at y = H.

import type { Appearance, Eyes } from '../../content/appearance';

export type { Appearance, Eyes };

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** CSS-style corner radii: horizontal and vertical radius per corner (tl, tr, br, bl). */
export interface Corners {
  rx: [number, number, number, number];
  ry: [number, number, number, number];
}

export interface PegGeometry {
  H: number;
  W: number;
  /** Full width including a wheelchair. */
  RW: number;
  d: number;
  head: Box;
  body: Box;
  bodyCorners: Corners;
  band: Box;
  cap: Box | null;
  capCorners: Corners;
  locks: [Box, Box] | null;
  top: Box | null;
  eyes: [Box, Box];
  eyeShape: 'dot' | 'bar' | 'oval';
  cheeks: [Box, Box];
  mouth: Box;
  mouthShape: 'smile' | 'o';
  lineWidth: number;
  hear: Box | null;
  arm: Box | null;
  wheelchair: { handle: Box; wheel: Box; wheelBorder: number; hub: Box; caster: Box } | null;
}

/** Elliptical corners from CSS percentages of the box size. */
function corners(
  b: Box,
  h: [number, number, number, number],
  v: [number, number, number, number],
): Corners {
  return {
    rx: [h[0] * b.w, h[1] * b.w, h[2] * b.w, h[3] * b.w],
    ry: [v[0] * b.h, v[1] * b.h, v[2] * b.h, v[3] * b.h],
  };
}

export function pegGeometry(size: number, a: Appearance, eyes: Eyes = 'open'): PegGeometry {
  const H = size;
  const W = Math.round(H * 0.62);
  const d = Math.round(W * 0.86);
  const hx = (W - d) / 2;
  const hy = H * 0.1;
  const by = hy + d * 0.8;
  const bh = H - by;
  const eS = Math.max(3, d * 0.1);
  const st = a.hairStyle;

  const eye = (x: number): Box =>
    eyes === 'sleep'
      ? { x: x - d * 0.02, y: hy + d * 0.53, w: d * 0.15, h: Math.max(2.5, d * 0.04) }
      : {
          x,
          y: hy + d * 0.47,
          w: eS * (eyes === 'wow' ? 1.25 : 1),
          h: eS * (eyes === 'wow' ? 1.5 : 1),
        };

  const body: Box = { x: 0, y: by, w: W, h: bh };
  const cap: Box = {
    x: hx - d * 0.05,
    y: hy - d * 0.05,
    w: d * 1.1,
    h: d * (st === 'crop' ? 0.34 : 0.44),
  };

  return {
    H,
    W,
    RW: a.aid === 'wheelchair' ? W * 1.25 : W,
    d,
    head: { x: hx, y: hy, w: d, h: d },
    body,
    bodyCorners: corners(body, [0.46, 0.46, 0.2, 0.2], [0.36, 0.36, 0.1, 0.1]),
    band: { x: W * 0.06, y: H - bh * 0.18, w: W * 0.88, h: bh * 0.14 },
    cap: st === 'none' ? null : cap,
    capCorners: corners(cap, [0.5, 0.5, 0.3, 0.3], [0.82, 0.82, 0.22, 0.22]),
    locks:
      st === 'bob'
        ? [
            { x: hx - d * 0.05, y: hy + d * 0.18, w: d * 0.2, h: d * 0.58 },
            { x: hx + d * 0.85, y: hy + d * 0.18, w: d * 0.2, h: d * 0.58 },
          ]
        : null,
    top:
      st === 'puff'
        ? { x: W / 2 - d * 0.4, y: hy - d * 0.34, w: d * 0.8, h: d * 0.74 }
        : st === 'bun'
          ? { x: W / 2 - d * 0.17, y: hy - d * 0.26, w: d * 0.34, h: d * 0.34 }
          : null,
    eyes: [eye(hx + d * 0.3), eye(hx + d * 0.6)],
    eyeShape: eyes === 'sleep' ? 'bar' : eyes === 'wow' ? 'oval' : 'dot',
    cheeks: [
      { x: hx + d * 0.13, y: hy + d * 0.64, w: d * 0.17, h: d * 0.1 },
      { x: hx + d * 0.7, y: hy + d * 0.64, w: d * 0.17, h: d * 0.1 },
    ],
    mouth:
      eyes === 'wow'
        ? { x: hx + d * 0.44, y: hy + d * 0.68, w: d * 0.12, h: d * 0.14 }
        : { x: hx + d * 0.4, y: hy + d * 0.64, w: d * 0.2, h: d * 0.1 },
    mouthShape: eyes === 'wow' ? 'o' : 'smile',
    lineWidth: Math.max(2, d * 0.045),
    hear:
      a.aid === 'hearing' ? { x: hx - d * 0.06, y: hy + d * 0.44, w: d * 0.14, h: d * 0.22 } : null,
    arm: a.aid === 'arm' ? { x: W * 0.02, y: by + bh * 0.22, w: W * 0.17, h: bh * 0.44 } : null,
    wheelchair:
      a.aid === 'wheelchair'
        ? {
            handle: { x: W * 0.84, y: by - bh * 0.08, w: H * 0.05, h: bh * 0.8 },
            wheel: { x: W * 0.42, y: H * 0.53, w: H * 0.46, h: H * 0.46 },
            wheelBorder: H * 0.05,
            hub: { x: W * 0.42 + H * 0.2, y: H * 0.53 + H * 0.2, w: H * 0.06, h: H * 0.06 },
            caster: { x: W * 0.02, y: H * 0.87, w: H * 0.12, h: H * 0.12 },
          }
        : null,
  };
}
