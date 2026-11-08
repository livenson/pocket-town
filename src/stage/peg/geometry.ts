// Peg-folk geometry, ported from design-reference/Peg.dc.html (renderVals). Pure
// numbers, no Pixi, so it can be unit-tested. Coordinates: origin top-left of the
// peg's box; the feet are at y = H.

import type {
  Accessory,
  Appearance,
  Clothes,
  Eyes,
  Figure,
  HairStyle,
  Kind,
  Pattern,
} from '../../content/appearance';
import { clampFace } from '../../content/appearance';

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
  /** Full width of the figure, arms and hands included. */
  RW: number;
  /** Left edge of the figure (the left hand reaches past x = 0). */
  left: number;
  /** Legs, from under the body to the ankles (left, right). */
  legs: [Box, Box];
  /** Height of the shoes or paws at the bottom. */
  shoeH: number;
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
  mouthStyle: 'smile' | 'grin' | 'calm';
  /** Stripes or dots across the body, and a collar. */
  pattern: Pattern;
  accessory: Accessory;
  hairStyle: HairStyle;
  freckles: boolean;
  kind: Kind;
  figure: Figure | null;
  clothes: Clothes;
  /** Head radii (a circle unless the face shape says otherwise). */
  headRx: number;
  headRy: number;
  /** Size multiplier of the eyes (advanced face). */
  eyeScale: number;
  /** The head's outline, x and y pairs (a circle unless the face shape says otherwise). */
  headPoly: number[];
}

/** Width and height of each face shape, relative to the classic round head. */
const FACE_SHAPES = {
  round: [1, 1],
  oval: [0.9, 1.08],
  wide: [1.1, 0.94],
  heart: [1.04, 1.04],
  square: [1, 0.98],
  pear: [1.02, 1.02],
} as const;

/**
 * The head's outline as a polygon (x, y pairs), so faces can be more than circles:
 * a squarer jaw, a pointed chin, fuller cheeks. Round, oval and wide are ellipses.
 */
export function headOutline(
  shape: keyof typeof FACE_SHAPES,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): number[] {
  const pts: number[] = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    let c = Math.cos(t);
    let s = Math.sin(t); // positive is down (the chin)
    if (shape === 'square') {
      // A superellipse: flatter sides and a broad jaw.
      c = Math.sign(c) * Math.abs(c) ** 0.6;
      s = Math.sign(s) * Math.abs(s) ** (s > 0 ? 0.55 : 0.85);
    }
    let w = 1;
    if (shape === 'heart') w = s > 0 ? 1 - 0.5 * s ** 1.5 : 1 + 0.05 * -s;
    if (shape === 'pear') w = s > 0 ? 1 + 0.15 * Math.sin(Math.PI * s) : 1 - 0.18 * -s;
    pts.push(cx + rx * c * w, cy + ry * s * (shape === 'heart' && s > 0 ? 1.06 : 1));
  }
  return pts;
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
  // Legs below the body; the figure keeps its full height, so nothing else moves.
  const legH = H * 0.15;
  const shoeH = H * 0.06;
  const bh = H - legH - by;
  const st = a.hairStyle;
  const f = clampFace(a.face ?? {});
  const eyeScale = f.eyeSize ?? 1;
  const gap = f.eyeGap ?? 1;
  const eS = Math.max(3, d * 0.1);
  const [sx, sy] = FACE_SHAPES[f.shape ?? 'round'];

  // Eye boxes keep their centres; size and spacing move them around those.
  const eye = (x: number): Box => {
    const base =
      eyes === 'sleep'
        ? { x: x - d * 0.02, y: hy + d * 0.53, w: d * 0.15, h: Math.max(2.5, d * 0.04) }
        : {
            x,
            y: hy + d * 0.47,
            w: eS * (eyes === 'wow' ? 1.25 : 1),
            h: eS * (eyes === 'wow' ? 1.5 : 1),
          };
    if (eyeScale === 1 && gap === 1) return base;
    const cx = W / 2 - (W / 2 - (base.x + base.w / 2)) * gap;
    const cy = base.y + base.h / 2;
    const w = base.w * eyeScale;
    const h = base.h * (eyes === 'sleep' ? 1 : eyeScale);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };
  const mouthScale = f.mouthWidth ?? 1;
  const widen = (m: Box): Box =>
    mouthScale === 1 ? m : { ...m, x: m.x + m.w / 2 - (m.w * mouthScale) / 2, w: m.w * mouthScale };

  const body: Box = { x: 0, y: by, w: W, h: bh };
  const legW = W * 0.2;
  const legTop = by + bh - legH * 0.4;
  const leg = (x: number): Box => ({ x, y: legTop, w: legW, h: H - shoeH * 0.5 - legTop });
  const figure = a.figure ?? null;
  // Shoulders: broad and square for boys, soft and round for girls.
  const shoulders: [number, number] =
    figure === 'boy' ? [0.34, 0.24] : figure === 'girl' ? [0.5, 0.42] : [0.46, 0.36];
  const cap: Box = {
    x: hx - d * 0.05,
    y: hy - d * 0.05,
    w: d * 1.1,
    h: d * (st === 'crop' || st === 'spiky' ? 0.34 : 0.44),
  };

  return {
    H,
    W,
    RW: W * 1.24,
    left: -W * 0.12,
    legs: [leg(W * 0.5 - legW - W * 0.04), leg(W * 0.5 + W * 0.04)],
    shoeH,
    d,
    head: { x: hx, y: hy, w: d, h: d },
    body,
    bodyCorners: corners(
      body,
      [shoulders[0], shoulders[0], 0.2, 0.2],
      [shoulders[1], shoulders[1], 0.12, 0.12],
    ),
    band: { x: W * 0.06, y: by + bh - bh * 0.2, w: W * 0.88, h: bh * 0.15 },
    cap: st === 'none' ? null : cap,
    capCorners: corners(cap, [0.5, 0.5, 0.3, 0.3], [0.82, 0.82, 0.22, 0.22]),
    locks:
      st === 'bob' || st === 'long'
        ? [
            {
              x: hx - d * 0.05,
              y: hy + d * 0.18,
              w: d * 0.2,
              h: d * (st === 'long' ? 0.98 : 0.58),
            },
            {
              x: hx + d * 0.85,
              y: hy + d * 0.18,
              w: d * 0.2,
              h: d * (st === 'long' ? 0.98 : 0.58),
            },
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
        : widen({ x: hx + d * 0.4, y: hy + d * 0.64, w: d * 0.2, h: d * 0.1 }),
    mouthShape: eyes === 'wow' ? 'o' : 'smile',
    lineWidth: Math.max(2, d * 0.045),
    mouthStyle: a.mouth ?? 'smile',
    pattern: a.pattern ?? 'plain',
    accessory: a.accessory ?? 'none',
    hairStyle: st,
    freckles: a.freckles === true,
    kind: a.kind ?? 'person',
    figure,
    clothes: a.clothes ?? 'tunic',
    headRx: (d / 2) * sx,
    headRy: (d / 2) * sy,
    headPoly: headOutline(f.shape ?? 'round', W / 2, hy + d / 2, (d / 2) * sx, (d / 2) * sy),
    eyeScale,
  };
}
