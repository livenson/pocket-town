// Wizard extras on a peg-folk character (clothes patterns, accessories, mouths)
// as simple shapes, so the Pixi stage and the SVG portraits draw exactly the same.
import type { Appearance } from '../../content/appearance';
import { color } from '../../design/tokens';
import type { PegGeometry } from './geometry';

export type Prim =
  | {
      t: 'rect';
      x: number;
      y: number;
      w: number;
      h: number;
      r: number;
      fill: string;
      alpha?: number;
    }
  | {
      t: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: string;
      stroke?: string;
      sw?: number;
      alpha?: number;
    }
  | { t: 'poly'; pts: number[]; fill: string }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number };

/** Shapes drawn over the body (patterns), before the head. */
export function bodyExtras(g: PegGeometry, a: Appearance): Prim[] {
  const accent = a.accent ?? '#FFF8F0';
  const { body, W } = g;
  const out: Prim[] = [];
  if (g.pattern === 'stripes') {
    for (const f of [0.42, 0.6]) {
      out.push({
        t: 'rect',
        x: W * 0.03,
        y: body.y + body.h * f,
        w: W * 0.94,
        h: body.h * 0.09,
        r: 2,
        fill: accent,
        alpha: 0.85,
      });
    }
  } else if (g.pattern === 'dots') {
    const r = W * 0.045;
    for (const [fx, fy] of [
      [0.25, 0.45],
      [0.55, 0.4],
      [0.78, 0.52],
      [0.4, 0.63],
      [0.68, 0.7],
    ] as const) {
      out.push({
        t: 'ellipse',
        cx: W * fx,
        cy: body.y + body.h * fy,
        rx: r,
        ry: r,
        fill: accent,
        alpha: 0.9,
      });
    }
  } else if (g.pattern === 'collar') {
    const cx = W / 2;
    const top = body.y + body.h * 0.06;
    out.push({
      t: 'poly',
      pts: [cx - W * 0.2, top, cx, top + body.h * 0.22, cx - W * 0.02, top],
      fill: accent,
    });
    out.push({
      t: 'poly',
      pts: [cx + W * 0.2, top, cx, top + body.h * 0.22, cx + W * 0.02, top],
      fill: accent,
    });
  }
  return out;
}

/** Shapes drawn over the face and hair (accessories). */
export function headExtras(g: PegGeometry, a: Appearance): Prim[] {
  const accent = a.accent ?? color.tomato;
  const { head, d } = g;
  const out: Prim[] = [];
  if (g.accessory === 'glasses') {
    const r = d * 0.13;
    const sw = Math.max(2, d * 0.04);
    const [l, rt] = g.eyes;
    const cy = l.y + l.h / 2;
    out.push({ t: 'ellipse', cx: l.x + l.w / 2, cy, rx: r, ry: r, stroke: color.ink, sw });
    out.push({ t: 'ellipse', cx: rt.x + rt.w / 2, cy, rx: r, ry: r, stroke: color.ink, sw });
    out.push({
      t: 'line',
      x1: l.x + l.w / 2 + r,
      y1: cy,
      x2: rt.x + rt.w / 2 - r,
      y2: cy,
      stroke: color.ink,
      sw,
    });
  } else if (g.accessory === 'bow') {
    const cx = head.x + d * 0.78;
    const cy = head.y + d * 0.06;
    const s = d * 0.16;
    out.push({
      t: 'poly',
      pts: [cx, cy, cx - s * 1.3, cy - s, cx - s * 1.3, cy + s],
      fill: accent,
    });
    out.push({
      t: 'poly',
      pts: [cx, cy, cx + s * 1.3, cy - s, cx + s * 1.3, cy + s],
      fill: accent,
    });
    out.push({ t: 'ellipse', cx, cy, rx: s * 0.45, ry: s * 0.45, fill: color.ink });
  } else if (g.accessory === 'hat') {
    out.push({
      t: 'ellipse',
      cx: head.x + d / 2,
      cy: head.y + d * 0.16,
      rx: d * 0.52,
      ry: d * 0.34,
      fill: accent,
    });
    out.push({
      t: 'rect',
      x: head.x - d * 0.08,
      y: head.y + d * 0.2,
      w: d * 1.16,
      h: d * 0.12,
      r: d * 0.06,
      fill: color.ink,
      alpha: 0.85,
    });
    out.push({
      t: 'ellipse',
      cx: head.x + d / 2,
      cy: head.y - d * 0.2,
      rx: d * 0.1,
      ry: d * 0.1,
      fill: '#FFF8F0',
    });
  }
  return out;
}

/** The mouth, by style (the "wow" face keeps its round mouth). */
export function mouthPrims(g: PegGeometry): Prim[] | null {
  if (g.mouthShape === 'o' || g.mouthStyle === 'smile') return null;
  const m = g.mouth;
  if (g.mouthStyle === 'calm') {
    const y = m.y + m.h * 0.6;
    return [
      {
        t: 'line',
        x1: m.x + m.w * 0.15,
        y1: y,
        x2: m.x + m.w * 0.85,
        y2: y,
        stroke: color.ink,
        sw: g.lineWidth,
      },
    ];
  }
  // Grin: an open half-moon.
  return [
    {
      t: 'poly',
      pts: [
        m.x,
        m.y + m.h * 0.2,
        m.x + m.w,
        m.y + m.h * 0.2,
        m.x + m.w * 0.85,
        m.y + m.h * 1.0,
        m.x + m.w * 0.5,
        m.y + m.h * 1.3,
        m.x + m.w * 0.15,
        m.y + m.h * 1.0,
      ],
      fill: color.ink,
    },
  ];
}
