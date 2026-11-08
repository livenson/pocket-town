// The detailed peg-folk figure: a small skeleton (bones with joints) and the parts
// drawn on each bone, so arms bend at the elbow, legs at the knee, and clothes are
// layered: shirt over trousers, skirt over legs, cape behind. The head keeps the
// peg face (geometry.ts, face.ts, extras.ts) and rides on the neck.
// Pure numbers and shapes, no Pixi: the stage and the SVG portraits both draw it.
//
// Coordinates: the feet are at (0, 0); up is negative y. Every part is drawn in its
// bone's own space; a limb hangs along +y from its joint.
import { DEFAULT_SECOND, type Appearance, type Clothes, type Eyes } from '../../content/appearance';
import { color } from '../../design/tokens';
import { bodyExtras, type Prim } from './extras';
import { tattooShape } from './face';
import { pegGeometry, type PegGeometry } from './geometry';
import { mix, SHOE, SUIT, SUIT_SHADE } from './outfit';

export const BONES = [
  'root',
  'pelvis',
  'torso',
  'neck',
  'head',
  'shoulderL',
  'elbowL',
  'wristL',
  'shoulderR',
  'elbowR',
  'wristR',
  'hipL',
  'kneeL',
  'ankleL',
  'hipR',
  'kneeR',
  'ankleR',
  'tail',
] as const;
export type BoneId = (typeof BONES)[number];

interface BoneDef {
  parent: BoneId | null;
  x: number;
  y: number;
}

/** A drawn part on a bone, or the place in the drawing order where the head goes. */
export type Part = { bone: BoneId; prims: Prim[] } | { bone: 'head'; head: true };

export interface Rig {
  size: number;
  bones: Record<BoneId, BoneDef>;
  /** Back to front. */
  parts: Part[];
  /** Where the head drawing's own coordinates meet the head bone. */
  headPivot: { x: number; y: number };
}

/** Joint angles in radians (clockwise on screen); missing bones keep their rest angle. */
export type Angles = Partial<Record<BoneId, number>>;

/** A 2D affine matrix: x' = a·x + c·y + tx, y' = b·x + d·y + ty. */
export interface Mat {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

const INK = color.ink;
/** The head is drawn as a peg head of this share of the figure's height. */
export const HEAD_SCALE = 0.75;

export const outlineOf = (c: string) => mix(c, INK, 0.5);
const shadeOf = (c: string) => mix(c, INK, 0.16);
const lightOf = (c: string) => mix(c, '#FFFFFF', 0.35);
const second = (a: Appearance) => a.second ?? DEFAULT_SECOND;

/** Body measurements, as shares of the figure's height. */
function build(a: Appearance) {
  const f = a.figure;
  return {
    /** Shoulder joints from the middle. */
    sh: f === 'boy' ? 0.118 : f === 'girl' ? 0.1 : 0.11,
    waist: f === 'boy' ? 0.09 : f === 'girl' ? 0.078 : 0.086,
    hip: f === 'boy' ? 0.096 : f === 'girl' ? 0.106 : 0.1,
  };
}

/** Shoulder width (between the shoulder joints) for a size. */
export function shoulderWidth(size: number, a: Appearance): number {
  return build(a).sh * 2 * size;
}

function bonesFor(s: number, a: Appearance): Record<BoneId, BoneDef> {
  const { sh } = build(a);
  const b = (parent: BoneId | null, x: number, y: number): BoneDef => ({
    parent,
    x: x * s,
    y: y * s,
  });
  return {
    root: b(null, 0, 0),
    pelvis: b('root', 0, -0.27),
    torso: b('pelvis', 0, 0),
    neck: b('torso', 0, -0.212),
    head: b('neck', 0, -0.03),
    shoulderL: b('torso', -sh, -0.18),
    elbowL: b('shoulderL', 0, 0.095),
    wristL: b('elbowL', 0, 0.08),
    shoulderR: b('torso', sh, -0.18),
    elbowR: b('shoulderR', 0, 0.095),
    wristR: b('elbowR', 0, 0.08),
    hipL: b('pelvis', -0.05, 0),
    kneeL: b('hipL', 0, 0.125),
    ankleL: b('kneeL', 0, 0.11),
    hipR: b('pelvis', 0.05, 0),
    kneeR: b('hipR', 0, 0.125),
    ankleR: b('kneeR', 0, 0.11),
    // Behind: when the figure faces right, its back is on the left.
    tail: b('pelvis', -0.07, -0.01),
  };
}

/** Points along a quadratic curve from (x0, y0) to (x1, y1), start excluded. */
function quad(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n = 6) {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return out;
}

/** A rounded limb segment hanging along +y, with outline, shade and a highlight. */
function limb(len: number, w: number, fill: string, lw: number): Prim[] {
  return [
    {
      t: 'rect',
      x: -w / 2,
      y: -w * 0.3,
      w,
      h: len + w * 0.6,
      r: w / 2,
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
    {
      t: 'rect',
      x: w * 0.1,
      y: w * 0.05,
      w: w * 0.3,
      h: len - w * 0.1,
      r: w * 0.15,
      fill: shadeOf(fill),
    },
    {
      t: 'rect',
      x: -w * 0.36,
      y: w * 0.1,
      w: w * 0.15,
      h: len * 0.55,
      r: w * 0.075,
      fill: lightOf(fill),
      alpha: 0.7,
    },
  ];
}

/** Cloth over the top part of a limb: a sleeve, or the leg of a pair of shorts. */
function cover(len: number, w: number, share: number, fill: string, lw: number): Prim[] {
  const cw = w * 1.12;
  return [
    {
      t: 'rect',
      x: -cw / 2,
      y: -w * 0.32,
      w: cw,
      h: len * share + w * 0.32,
      r: Math.min(cw / 2, len * share * 0.4),
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
    {
      t: 'rect',
      x: cw * 0.12,
      y: 0,
      w: cw * 0.28,
      h: len * share - lw,
      r: cw * 0.1,
      fill: shadeOf(fill),
    },
  ];
}

/** A band around a limb (cuffs, socks' tops, boot trims). */
function band(y: number, w: number, h: number, fill: string, lw: number): Prim {
  return {
    t: 'rect',
    x: -w * 0.56,
    y,
    w: w * 1.12,
    h,
    r: h / 2,
    fill,
    stroke: outlineOf(fill),
    sw: lw * 0.8,
  };
}

/** Sleeves: long for trousers, capes and space suits, short otherwise. */
function sleeveKind(c: Clothes, a: Appearance): 'long' | 'short' {
  // A play tattoo on the arm shows, so the sleeves roll up.
  const armTattoo =
    (a.face?.tattoo ?? 'none') !== 'none' && (a.face?.tattooPlace ?? 'arm') === 'arm';
  if (c === 'space') return 'long';
  if (armTattoo) return 'short';
  return c === 'pants' || c === 'cape' ? 'long' : 'short';
}

/** The arm on one side: upper arm, forearm and hand. */
function armParts(s: number, a: Appearance, side: 'L' | 'R', lw: number): Part[] {
  const clothes = a.clothes ?? 'tunic';
  const space = clothes === 'space';
  const top = space ? SUIT : a.outfit;
  const upper = 0.095 * s;
  const fore = 0.08 * s;
  const wU = 0.058 * s;
  const wF = 0.052 * s;
  const sleeves = sleeveKind(clothes, a);
  const upperPrims =
    sleeves === 'long'
      ? limb(upper, wU, top, lw)
      : [...limb(upper, wU, a.skin, lw), ...cover(upper, wU, 0.62, top, lw)];
  const forePrims = limb(fore, wF, sleeves === 'long' ? top : a.skin, lw);
  if (sleeves === 'long' && !space)
    forePrims.push(band(fore - wF * 0.15, wF, wF * 0.42, shadeOf(top), lw));
  if (space) forePrims.push(band(fore - wF * 0.2, wF, wF * 0.5, a.outfit, lw));
  const f = a.face;
  if (
    side === 'R' &&
    f?.tattoo &&
    f.tattoo !== 'none' &&
    (f.tattooPlace ?? 'arm') === 'arm' &&
    !space
  )
    forePrims.push(
      ...tattooShape(f.tattoo, -wF * 0.05, fore * 0.42, wF * 0.34, f.tattooColour ?? '#3D5AA8'),
    );
  // Hands: gloves in space, paws for animals (in their fur), the thumb towards the body.
  const hand = space ? SUIT_SHADE : a.skin;
  const inward = side === 'L' ? 1 : -1;
  const hr = 0.03 * s;
  const handPrims: Prim[] = [
    {
      t: 'ellipse',
      cx: inward * hr * 0.55,
      cy: hr * 0.45,
      rx: hr * 0.4,
      ry: hr * 0.6,
      fill: hand,
      stroke: outlineOf(hand),
      sw: lw * 0.9,
    },
    {
      t: 'ellipse',
      cx: 0,
      cy: hr * 0.85,
      rx: hr,
      ry: hr * 1.05,
      fill: hand,
      stroke: outlineOf(hand),
      sw: lw,
    },
    {
      t: 'ellipse',
      cx: -inward * hr * 0.35,
      cy: hr * 0.6,
      rx: hr * 0.28,
      ry: hr * 0.4,
      fill: lightOf(hand),
      alpha: 0.6,
    },
  ];
  return [
    { bone: `shoulder${side}`, prims: upperPrims },
    { bone: `elbow${side}`, prims: forePrims },
    { bone: `wrist${side}`, prims: handPrims },
  ];
}

/** One leg: thigh, shin and a shoe (or a paw) pointing the way the figure faces. */
function legParts(s: number, a: Appearance, side: 'L' | 'R', lw: number): Part[] {
  const clothes = a.clothes ?? 'tunic';
  const animal = (a.kind ?? 'person') !== 'person';
  const thighL = 0.125 * s;
  const shinL = 0.11 * s;
  const wT = 0.074 * s;
  const wS = 0.064 * s;
  const leggings = mix(a.outfit, INK, 0.25);
  const legFill =
    clothes === 'space'
      ? SUIT
      : clothes === 'pants' || clothes === 'overalls'
        ? second(a)
        : clothes === 'cape'
          ? leggings
          : a.skin;
  const thigh = limb(thighL, wT, legFill, lw);
  if (clothes === 'shorts') thigh.push(...cover(thighL, wT, 0.6, second(a), lw));
  const shin = limb(shinL, wS, legFill, lw);
  // Socks with bare legs; trouser hems; boot tops in space and with a cape.
  if (!animal && (clothes === 'tunic' || clothes === 'dress' || clothes === 'shorts')) {
    shin.push({
      t: 'rect',
      x: -wS / 2,
      y: shinL * 0.62,
      w: wS,
      h: shinL * 0.38 + wS * 0.3,
      r: wS * 0.4,
      fill: color.paper,
      stroke: outlineOf(color.paper),
      sw: lw,
    });
    shin.push(band(shinL * 0.6, wS, wS * 0.3, a.accent ?? color.paper, lw));
  }
  if (clothes === 'pants' || clothes === 'overalls')
    shin.push(band(shinL - wS * 0.1, wS, wS * 0.4, shadeOf(second(a)), lw));
  if (clothes === 'space') shin.push(band(shinL * 0.55, wS, wS * 0.45, a.outfit, lw));
  if (clothes === 'cape') {
    const boot = second(a);
    shin.push({
      t: 'rect',
      x: -wS * 0.56,
      y: shinL * 0.45,
      w: wS * 1.12,
      h: shinL * 0.55 + wS * 0.3,
      r: wS * 0.3,
      fill: boot,
      stroke: outlineOf(boot),
      sw: lw,
    });
  }
  let foot: Prim[];
  if (animal) {
    const paw = mix(a.skin, INK, 0.12);
    foot = [
      {
        t: 'ellipse',
        cx: 0.012 * s,
        cy: 0.014 * s,
        rx: 0.044 * s,
        ry: 0.026 * s,
        fill: paw,
        stroke: outlineOf(paw),
        sw: lw,
      },
    ];
    for (const dx of [0.0, 0.022, 0.044])
      foot.push({
        t: 'ellipse',
        cx: dx * s - 0.008 * s,
        cy: 0.02 * s,
        rx: 0.007 * s,
        ry: 0.006 * s,
        fill: outlineOf(paw),
        alpha: 0.5,
      });
  } else {
    const shoe = clothes === 'space' ? SUIT_SHADE : clothes === 'cape' ? second(a) : SHOE;
    const pts = [
      -0.032 * s,
      -0.014 * s,
      ...quad(-0.032 * s, -0.014 * s, -0.044 * s, 0.03 * s, -0.026 * s, 0.035 * s, 4),
      0.046 * s,
      0.035 * s,
      ...quad(0.046 * s, 0.035 * s, 0.066 * s, 0.032 * s, 0.054 * s, 0.006 * s, 4),
      ...quad(0.054 * s, 0.006 * s, 0.032 * s, -0.016 * s, 0.018 * s, -0.016 * s, 4),
    ];
    foot = [
      { t: 'poly', pts, fill: shoe, stroke: outlineOf(shoe), sw: lw },
      {
        t: 'rect',
        x: -0.034 * s,
        y: 0.026 * s,
        w: 0.088 * s,
        h: 0.009 * s,
        r: 0.0045 * s,
        fill: clothes === 'space' ? a.outfit : color.paper,
        alpha: 0.85,
      },
      {
        t: 'ellipse',
        cx: 0.03 * s,
        cy: 0.004 * s,
        rx: 0.012 * s,
        ry: 0.006 * s,
        fill: '#FFFFFF',
        alpha: 0.35,
      },
    ];
  }
  return [
    { bone: `hip${side}`, prims: thigh },
    { bone: `knee${side}`, prims: shin },
    { bone: `ankle${side}`, prims: foot },
  ];
}

/** The shirt or suit on the torso, from the neck to its hem. */
function torsoPart(s: number, a: Appearance, lw: number, g: PegGeometry): Prim[] {
  const clothes = a.clothes ?? 'tunic';
  const { sh, waist, hip } = build(a);
  const fill = clothes === 'space' ? SUIT : a.outfit;
  const top = -0.212 * s;
  const n = 0.045 * s;
  const shoulder = (sh + 0.026) * s;
  const w = waist * s;
  const hipW = hip * s;
  const [hemY, hemHalf] =
    clothes === 'tunic'
      ? [0.07 * s, hipW + 0.022 * s]
      : clothes === 'dress'
        ? [-0.03 * s, w + 0.004 * s]
        : clothes === 'cape'
          ? [0.03 * s, hipW + 0.006 * s]
          : [0.012 * s, hipW];
  const half = [
    ...quad(-n, top, -shoulder + 0.01 * s, top + 0.002 * s, -shoulder, top + 0.05 * s),
    ...quad(-shoulder, top + 0.05 * s, -shoulder + 0.004 * s, -0.09 * s, -w, -0.045 * s),
    ...quad(-w, -0.045 * s, -hipW * 1.02, -0.01 * s, -hemHalf, hemY),
  ];
  const right: number[] = [];
  for (let i = half.length - 2; i >= 0; i -= 2) right.push(-(half[i] ?? 0), half[i + 1] ?? 0);
  const pts = [
    -n,
    top,
    ...half,
    ...quad(-hemHalf, hemY, 0, hemY + 0.02 * s, hemHalf, hemY),
    ...right,
  ];
  const out: Prim[] = [
    { t: 'poly', pts, fill, stroke: outlineOf(fill), sw: lw },
    // Shade down the right side and a light stroke on the left.
    {
      t: 'rect',
      x: w * 0.32,
      y: top + 0.04 * s,
      w: w * 0.48,
      h: hemY - top - 0.06 * s,
      r: w * 0.2,
      fill: shadeOf(fill),
    },
    {
      t: 'rect',
      x: -w * 0.78,
      y: top + 0.06 * s,
      w: w * 0.16,
      h: 0.08 * s,
      r: w * 0.08,
      fill: lightOf(fill),
      alpha: 0.7,
    },
  ];
  // Patterns from the wizard, laid over the shirt.
  if (clothes !== 'space') {
    const W = hipW * 2;
    const body = { x: 0, y: top, w: W, h: hemY - top };
    out.push(...shift(bodyExtras({ ...g, W, body }, a), -hipW, 0));
  }
  // Neckline: the neck shows through a round collar.
  out.push({
    t: 'ellipse',
    cx: 0,
    cy: top + 0.004 * s,
    rx: n * 1.02,
    ry: 0.018 * s,
    fill: clothes === 'space' ? SUIT_SHADE : mix(a.skin, INK, 0.12),
    stroke: outlineOf(fill),
    sw: lw,
  });
  if (clothes === 'tunic') {
    // A pocket.
    out.push({
      t: 'rect',
      x: w * 0.2,
      y: -0.07 * s,
      w: 0.05 * s,
      h: 0.045 * s,
      r: 0.008 * s,
      fill: shadeOf(fill),
      stroke: outlineOf(fill),
      sw: lw * 0.8,
    });
  }
  if (clothes === 'pants') {
    // A shirt: collar points and buttons.
    for (const side of [-1, 1])
      out.push({
        t: 'poly',
        pts: [
          side * n * 0.2,
          top + 0.01 * s,
          side * n * 1.15,
          top - 0.004 * s,
          side * n * 0.7,
          top + 0.038 * s,
        ],
        fill: color.paper,
        stroke: outlineOf(color.paper),
        sw: lw * 0.8,
      });
    for (const f of [0.35, 0.55, 0.75])
      out.push({
        t: 'ellipse',
        cx: 0,
        cy: top + (hemY - top) * f,
        rx: 0.008 * s,
        ry: 0.008 * s,
        fill: outlineOf(fill),
      });
  }
  if (clothes === 'space') {
    const trim = a.outfit;
    out.push({
      t: 'rect',
      x: -0.06 * s,
      y: -0.15 * s,
      w: 0.12 * s,
      h: 0.07 * s,
      r: 0.012 * s,
      fill: trim,
      stroke: outlineOf(trim),
      sw: lw,
    });
    for (const [fx, c] of [
      [-0.032, color.tomato],
      [0, color.marigold],
      [0.032, color.teal],
    ] as const)
      out.push({ t: 'ellipse', cx: fx * s, cy: -0.115 * s, rx: 0.011 * s, ry: 0.011 * s, fill: c });
    out.push({
      t: 'rect',
      x: -hipW,
      y: -0.03 * s,
      w: hipW * 2,
      h: 0.026 * s,
      r: 0.006 * s,
      fill: trim,
      stroke: outlineOf(trim),
      sw: lw * 0.8,
    });
  }
  if (clothes === 'cape') {
    // An emblem on the chest and a belt.
    const c2 = second(a);
    out.push({
      t: 'ellipse',
      cx: 0,
      cy: -0.12 * s,
      rx: 0.034 * s,
      ry: 0.034 * s,
      fill: color.marigold,
      stroke: outlineOf(color.marigold),
      sw: lw,
    });
    out.push({ t: 'ellipse', cx: 0, cy: -0.12 * s, rx: 0.016 * s, ry: 0.016 * s, fill: c2 });
    out.push({
      t: 'rect',
      x: -w - 0.004 * s,
      y: -0.045 * s,
      w: (w + 0.004 * s) * 2,
      h: 0.022 * s,
      r: 0.006 * s,
      fill: c2,
      stroke: outlineOf(c2),
      sw: lw * 0.8,
    });
  }
  return out;
}

/** Move shapes by (dx, dy). */
export function shift(prims: Prim[], dx: number, dy: number): Prim[] {
  return prims.map((p) => {
    if (p.t === 'rect') return { ...p, x: p.x + dx, y: p.y + dy };
    if (p.t === 'ellipse') return { ...p, cx: p.cx + dx, cy: p.cy + dy };
    if (p.t === 'line') return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
    return { ...p, pts: p.pts.map((v, i) => v + (i % 2 === 0 ? dx : dy)) };
  });
}

/** Trousers, shorts and dungarees at the hips (the legs are on the leg bones). */
function bottomsPart(s: number, a: Appearance, lw: number): Prim[] {
  const clothes = a.clothes ?? 'tunic';
  if (clothes !== 'pants' && clothes !== 'shorts' && clothes !== 'overalls') return [];
  const fill = second(a);
  const hipW = build(a).hip * s;
  const y0 = -0.015 * s;
  const y1 = 0.055 * s;
  return [
    {
      t: 'poly',
      pts: [
        -hipW,
        y0,
        hipW,
        y0,
        hipW + 0.006 * s,
        y1,
        0.012 * s,
        y1,
        0,
        y1 - 0.02 * s,
        -0.012 * s,
        y1,
        -hipW - 0.006 * s,
        y1,
      ],
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
    {
      t: 'rect',
      x: hipW * 0.35,
      y: y0 + lw,
      w: hipW * 0.5,
      h: y1 - y0 - lw * 2,
      r: hipW * 0.15,
      fill: shadeOf(fill),
    },
  ];
}

/** A belt over the shirt's hem (trousers and shorts). */
function beltPart(s: number, a: Appearance, lw: number): Prim[] {
  const clothes = a.clothes ?? 'tunic';
  if (clothes !== 'pants' && clothes !== 'shorts') return [];
  const fill = shadeOf(second(a));
  const hipW = build(a).hip * s;
  return [
    {
      t: 'rect',
      x: -hipW - 0.002 * s,
      y: -0.012 * s,
      w: (hipW + 0.002 * s) * 2,
      h: 0.026 * s,
      r: 0.008 * s,
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
    {
      t: 'rect',
      x: -0.016 * s,
      y: -0.01 * s,
      w: 0.032 * s,
      h: 0.022 * s,
      r: 0.004 * s,
      fill: color.marigold,
      stroke: outlineOf(color.marigold),
      sw: lw * 0.8,
    },
  ];
}

/** The bib and straps of dungarees, over the shirt. */
function bibPart(s: number, a: Appearance, lw: number): Prim[] {
  if (a.clothes !== 'overalls') return [];
  const fill = second(a);
  const { sh } = build(a);
  const top = -0.14 * s;
  const out: Prim[] = [];
  for (const side of [-1, 1]) {
    out.push({
      t: 'line',
      x1: side * 0.05 * s,
      y1: top + 0.01 * s,
      x2: side * (sh - 0.012) * s,
      y2: -0.205 * s,
      stroke: outlineOf(fill),
      sw: 0.024 * s,
    });
    out.push({
      t: 'line',
      x1: side * 0.05 * s,
      y1: top + 0.01 * s,
      x2: side * (sh - 0.012) * s,
      y2: -0.205 * s,
      stroke: fill,
      sw: 0.024 * s - lw * 1.6,
    });
  }
  out.push(
    {
      t: 'rect',
      x: -0.064 * s,
      y: top,
      w: 0.128 * s,
      h: 0.16 * s,
      r: 0.012 * s,
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
    {
      t: 'rect',
      x: -0.026 * s,
      y: top + 0.04 * s,
      w: 0.052 * s,
      h: 0.036 * s,
      r: 0.006 * s,
      fill: shadeOf(fill),
      stroke: outlineOf(fill),
      sw: lw * 0.7,
    },
  );
  for (const side of [-1, 1])
    out.push({
      t: 'ellipse',
      cx: side * 0.045 * s,
      cy: top + 0.016 * s,
      rx: 0.01 * s,
      ry: 0.01 * s,
      fill: color.marigold,
      stroke: outlineOf(color.marigold),
      sw: lw * 0.7,
    });
  return out;
}

/** A dress's skirt from the waist, flaring to just above the knees. */
function skirtPart(s: number, a: Appearance, lw: number): Prim[] {
  if (a.clothes !== 'dress') return [];
  const fill = a.outfit;
  const w = build(a).waist * s;
  const top = -0.05 * s;
  const hem = 0.115 * s;
  const flare = 0.165 * s;
  const pts = [
    -w,
    top,
    w,
    top,
    ...quad(w, top, w + 0.04 * s, 0.02 * s, flare, hem),
    ...quad(flare, hem, 0, hem + 0.03 * s, -flare, hem),
    ...quad(-flare, hem, -w - 0.04 * s, 0.02 * s, -w, top),
  ];
  const out: Prim[] = [
    { t: 'poly', pts, fill, stroke: outlineOf(fill), sw: lw },
    {
      t: 'poly',
      pts: [
        w * 0.4,
        top + lw,
        w * 0.95,
        top + lw,
        flare * 0.92,
        hem - lw,
        flare * 0.4,
        hem + 0.008 * s,
      ],
      fill: shadeOf(fill),
    },
  ];
  // Soft folds.
  for (const f of [-0.5, 0, 0.5])
    out.push({
      t: 'poly',
      pts: [
        f * w - 0.003 * s,
        top + 0.03 * s,
        f * w + 0.003 * s,
        top + 0.03 * s,
        f * flare + 0.004 * s,
        hem + 0.01 * s,
        f * flare - 0.004 * s,
        hem + 0.01 * s,
      ],
      fill: outlineOf(fill),
      alpha: 0.25,
    });
  // A ribbon at the waist.
  const ribbon = a.accent ?? color.paper;
  out.push({
    t: 'rect',
    x: -w - 0.004 * s,
    y: top - 0.006 * s,
    w: (w + 0.004 * s) * 2,
    h: 0.022 * s,
    r: 0.008 * s,
    fill: ribbon,
    stroke: outlineOf(ribbon),
    sw: lw * 0.8,
  });
  return out;
}

/** A cape hangs from the shoulders behind the figure; a space suit has a backpack. */
function backPart(s: number, a: Appearance, lw: number): Prim[] {
  if (a.clothes === 'cape') {
    const fill = second(a);
    const pts = [
      -0.075 * s,
      -0.215 * s,
      0.075 * s,
      -0.215 * s,
      ...quad(0.075 * s, -0.215 * s, 0.17 * s, -0.05 * s, 0.205 * s, 0.24 * s),
      ...quad(0.205 * s, 0.24 * s, 0, 0.26 * s, -0.205 * s, 0.24 * s),
      ...quad(-0.205 * s, 0.24 * s, -0.17 * s, -0.05 * s, -0.075 * s, -0.215 * s),
    ];
    return [
      { t: 'poly', pts, fill, stroke: outlineOf(fill), sw: lw },
      {
        t: 'poly',
        pts: [0.07 * s, -0.2 * s, 0.12 * s, -0.1 * s, 0.195 * s, 0.235 * s, 0.11 * s, 0.245 * s],
        fill: shadeOf(fill),
      },
    ];
  }
  if (a.clothes === 'space')
    return [
      {
        t: 'rect',
        x: -0.15 * s,
        y: -0.19 * s,
        w: 0.3 * s,
        h: 0.15 * s,
        r: 0.03 * s,
        fill: SUIT_SHADE,
        stroke: outlineOf(SUIT_SHADE),
        sw: lw,
      },
    ];
  return [];
}

/** The cape's clasp at the neck, in front. */
function claspPart(s: number, a: Appearance, lw: number): Prim[] {
  if (a.clothes !== 'cape') return [];
  const out: Prim[] = [];
  for (const side of [-1, 1])
    out.push({
      t: 'poly',
      pts: [side * 0.04 * s, -0.21 * s, side * 0.11 * s, -0.2 * s, side * 0.09 * s, -0.17 * s],
      fill: second(a),
      stroke: outlineOf(second(a)),
      sw: lw * 0.8,
    });
  out.push({
    t: 'ellipse',
    cx: 0,
    cy: -0.2 * s,
    rx: 0.016 * s,
    ry: 0.014 * s,
    fill: color.marigold,
    stroke: outlineOf(color.marigold),
    sw: lw * 0.8,
  });
  return out;
}

/** Animals have a tail behind them. */
function tailPart(s: number, a: Appearance, lw: number): Prim[] {
  const kind = a.kind ?? 'person';
  if (kind === 'person') return [];
  const fur = a.skin;
  const curve = (cx: number, cy: number, x1: number, y1: number, w: number, fill: string) => {
    const pts = [0, 0, ...quad(0, 0, cx * s, cy * s, x1 * s, y1 * s, 8)];
    const out: Prim[] = [];
    for (const [width, c] of [
      [w * s + lw * 2, outlineOf(fill)],
      [w * s, fill],
    ] as const)
      for (let i = 0; i + 3 < pts.length; i += 2)
        out.push({
          t: 'line',
          x1: pts[i] ?? 0,
          y1: pts[i + 1] ?? 0,
          x2: pts[i + 2] ?? 0,
          y2: pts[i + 3] ?? 0,
          stroke: c,
          sw: width,
        });
    return out;
  };
  const ball = (r: number, fill: string): Prim[] => [
    {
      t: 'ellipse',
      cx: -0.01 * s,
      cy: 0,
      rx: r * s,
      ry: r * s,
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
  ];
  switch (kind) {
    case 'cat':
      return curve(-0.11, 0.02, -0.09, -0.12, 0.026, fur);
    case 'mouse':
      return curve(-0.13, 0.05, -0.12, -0.08, 0.01, mix(fur, '#FF8FA8', 0.5));
    case 'dog':
      return curve(-0.06, 0, -0.06, -0.07, 0.026, fur);
    case 'bunny':
      return ball(0.034, mix(fur, '#FFFFFF', 0.6));
    case 'bear':
      return ball(0.024, fur);
  }
}

/** The neck, in skin (or the suit's ring in space). */
function neckPart(s: number, a: Appearance, lw: number): Prim[] {
  const fill = a.clothes === 'space' ? SUIT_SHADE : mix(a.skin, INK, 0.1);
  return [
    {
      t: 'rect',
      x: -0.032 * s,
      y: -0.04 * s,
      w: 0.064 * s,
      h: 0.056 * s,
      r: 0.02 * s,
      fill,
      stroke: outlineOf(fill),
      sw: lw,
    },
  ];
}

/** The head drawing (a peg head at HEAD_SCALE) for a size and eye state. */
export function headGeometry(size: number, a: Appearance, eyes: Eyes = 'open'): PegGeometry {
  return pegGeometry(size * HEAD_SCALE, a, eyes);
}

/** Outline width for a figure of this size. */
export function lineWidthFor(size: number): number {
  return Math.max(1, size * 0.012);
}

/** Build the figure for an appearance: bones, and the parts back to front. */
export function buildRig(size: number, a: Appearance): Rig {
  const s = size;
  const lw = lineWidthFor(s);
  const head = headGeometry(s, a);
  const parts: Part[] = [];
  const add = (bone: BoneId, prims: Prim[]) => {
    if (prims.length) parts.push({ bone, prims });
  };
  add('tail', tailPart(s, a, lw));
  add('torso', backPart(s, a, lw));
  parts.push(...armParts(s, a, 'L', lw));
  parts.push(...legParts(s, a, 'L', lw));
  parts.push(...legParts(s, a, 'R', lw));
  add('pelvis', bottomsPart(s, a, lw));
  add('neck', neckPart(s, a, lw));
  add('torso', torsoPart(s, a, lw, head));
  add('pelvis', skirtPart(s, a, lw));
  add('pelvis', beltPart(s, a, lw));
  add('torso', bibPart(s, a, lw));
  add('torso', claspPart(s, a, lw));
  parts.push({ bone: 'head', head: true });
  parts.push(...armParts(s, a, 'R', lw));
  return {
    size: s,
    bones: bonesFor(s, a),
    parts,
    // The chin sits a little below the head bone, over the top of the neck.
    headPivot: { x: head.W / 2, y: head.head.y + head.headRy * 2 - 0.02 * s },
  };
}

// ---------- Poses ----------

/** Standing at rest: arms a little away from the body, elbows soft. */
export const REST: Angles = { shoulderL: 0.1, shoulderR: -0.1, elbowL: -0.08, elbowR: 0.08 };

export type RigActivity = 'idle' | 'walk' | 'sleep' | 'dance';

export interface PoseInput {
  activity: RigActivity;
  /** Stage clock and a per-character offset, in seconds. */
  timeS: number;
  phase: number;
  /** Grows by one per step while walking. */
  stepPhase: number;
  walking: boolean;
  calm: boolean;
  /** 0 … 1: arms up for a happy jump. */
  cheer: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Joint angles for what the character is doing right now. */
export function poseAngles(p: PoseInput): Angles {
  const k = p.calm ? 0.45 : 1;
  const t = p.timeS + p.phase;
  let out: Angles;
  if (p.walking) {
    // One full stride every two steps; arms swing against the legs.
    const c = Math.sin(p.stepPhase * Math.PI);
    const amp = 0.3 * k;
    out = {
      hipL: amp * c,
      hipR: -amp * c,
      kneeL: Math.max(0, c) * amp * 1.3,
      kneeR: Math.max(0, -c) * amp * 1.3,
      shoulderL: 0.1 - amp * 0.9 * c,
      shoulderR: -0.1 + amp * 0.9 * c,
      elbowL: -0.25,
      elbowR: -0.25,
      torso: 0.04 * k,
      head: -0.02 * k,
    };
  } else if (p.activity === 'dance') {
    const d = Math.sin(t * Math.PI * 2 * 0.8);
    const up = p.calm ? 1.2 : 2.5;
    out = {
      shoulderL: up + 0.3 * k * d,
      shoulderR: -up + 0.3 * k * d,
      elbowL: -0.5 * k,
      elbowR: 0.5 * k,
      hipL: 0.12 * k * d,
      hipR: 0.12 * k * d,
      kneeL: 0.12 * k * Math.max(0, -d),
      kneeR: 0.12 * k * Math.max(0, d),
      head: 0.1 * k * d,
    };
  } else if (p.activity === 'sleep') {
    const b = Math.sin((t / 3) * Math.PI * 2);
    out = {
      shoulderL: 0.04,
      shoulderR: -0.04,
      elbowL: -0.15,
      elbowR: 0.15,
      head: 0.22 + 0.02 * b,
      torso: 0.03,
    };
  } else {
    // Idle: breathing moves the arms a touch; the head looks around now and then.
    const b = Math.sin((t / 2) * Math.PI * 2);
    const look = Math.sin((t / 3.7) * Math.PI * 2);
    out = {
      ...REST,
      shoulderL: 0.1 + 0.025 * k * b,
      shoulderR: -0.1 - 0.025 * k * b,
      head: 0.04 * k * look,
    };
  }
  if (p.cheer > 0) {
    const c = Math.sin(Math.min(1, p.cheer) * Math.PI);
    out = {
      ...out,
      shoulderL: lerp(out.shoulderL ?? 0, 2.6, c),
      shoulderR: lerp(out.shoulderR ?? 0, -2.6, c),
      elbowL: lerp(out.elbowL ?? 0, -0.3, c),
      elbowR: lerp(out.elbowR ?? 0, 0.3, c),
    };
  }
  return out;
}

const mul = (m: Mat, n: Mat): Mat => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  tx: m.a * n.tx + m.c * n.ty + m.tx,
  ty: m.b * n.tx + m.d * n.ty + m.ty,
});

/** Where every bone is, for a set of joint angles. */
export function boneMatrices(rig: Rig, angles: Angles): Record<BoneId, Mat> {
  const I: Mat = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  const out: Record<BoneId, Mat> = {
    root: I,
    pelvis: I,
    torso: I,
    neck: I,
    head: I,
    shoulderL: I,
    elbowL: I,
    wristL: I,
    shoulderR: I,
    elbowR: I,
    wristR: I,
    hipL: I,
    kneeL: I,
    ankleL: I,
    hipR: I,
    kneeR: I,
    ankleR: I,
    tail: I,
  };
  for (const id of BONES) {
    const b = rig.bones[id];
    const r = angles[id] ?? 0;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const local: Mat = { a: cos, b: sin, c: -sin, d: cos, tx: b.x, ty: b.y };
    out[id] = b.parent ? mul(out[b.parent], local) : local;
  }
  return out;
}

/** Apply a matrix to a point. */
export function apply(m: Mat, x: number, y: number): { x: number; y: number } {
  return { x: m.a * x + m.c * y + m.tx, y: m.b * x + m.d * y + m.ty };
}
