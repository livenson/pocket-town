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
  | { t: 'poly'; pts: number[]; fill: string; alpha?: number }
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
  } else if (g.pattern === 'heart' || g.pattern === 'star') {
    out.push(...badge(g.pattern, W / 2, body.y + body.h * 0.5, W * 0.14, accent));
  }
  return out;
}

/** A heart or star on the chest. */
function badge(kind: 'heart' | 'star', cx: number, cy: number, r: number, fill: string): Prim[] {
  if (kind === 'star') {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    }
    return [{ t: 'poly', pts, fill }];
  }
  const lobe = r * 0.52;
  return [
    { t: 'ellipse', cx: cx - lobe * 0.9, cy: cy - r * 0.2, rx: lobe, ry: lobe, fill },
    { t: 'ellipse', cx: cx + lobe * 0.9, cy: cy - r * 0.2, rx: lobe, ry: lobe, fill },
    {
      t: 'poly',
      pts: [cx - r * 0.98, cy - r * 0.05, cx + r * 0.98, cy - r * 0.05, cx, cy + r],
      fill,
    },
  ];
}

/** Hair shapes that are not just the cap: spikes and pigtails. */
function hairExtras(g: PegGeometry, a: Appearance): Prim[] {
  const { head, d } = g;
  if (g.hairStyle === 'spiky') {
    const base = head.y + d * 0.06;
    return [0.16, 0.38, 0.62, 0.84].map((f, i) => {
      const x = head.x + d * f;
      const tip = head.y - d * (i === 1 || i === 2 ? 0.22 : 0.12);
      return { t: 'poly', pts: [x - d * 0.13, base, x, tip, x + d * 0.13, base], fill: a.hair };
    });
  }
  if (g.hairStyle === 'pigtails') {
    const accent = a.accent ?? color.tomato;
    const y = head.y + d * 0.3;
    const out: Prim[] = [];
    for (const x of [head.x + d * 0.02, head.x + d * 0.98]) {
      out.push({ t: 'ellipse', cx: x, cy: y + d * 0.2, rx: d * 0.1, ry: d * 0.24, fill: a.hair });
      out.push({ t: 'ellipse', cx: x, cy: y - d * 0.02, rx: d * 0.06, ry: d * 0.06, fill: accent });
    }
    return out;
  }
  return [];
}

const PINK = '#FF8FA8';

/** Darker than light skin, lighter than dark skin, so freckles always show. */
function freckleColour(skin: string): string {
  const n = parseInt(skin.replace('#', ''), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 140 ? '#8A4B2A' : '#F2C49B';
}

/** Ears, nose and whiskers that turn a peg into an animal. The skin is the fur. */
function animalExtras(g: PegGeometry, a: Appearance): Prim[] {
  const { head, d } = g;
  const x = head.x;
  const y = head.y;
  const cx = x + d / 2;
  const fur = a.skin;
  const out: Prim[] = [];
  const whiskers = () => {
    const sw = Math.max(1, d * 0.018);
    for (const [y1, y2] of [
      [0.6, 0.57],
      [0.65, 0.67],
    ] as const) {
      out.push({
        t: 'line',
        x1: x + d * 0.2,
        y1: y + d * y1,
        x2: x - d * 0.03,
        y2: y + d * y2,
        stroke: color.ink,
        sw,
      });
      out.push({
        t: 'line',
        x1: x + d * 0.8,
        y1: y + d * y1,
        x2: x + d * 1.03,
        y2: y + d * y2,
        stroke: color.ink,
        sw,
      });
    }
  };
  const pinkNose = () =>
    out.push({
      t: 'poly',
      pts: [cx - d * 0.055, y + d * 0.555, cx + d * 0.055, y + d * 0.555, cx, y + d * 0.62],
      fill: PINK,
    });
  const darkNose = () =>
    out.push({ t: 'ellipse', cx, cy: y + d * 0.585, rx: d * 0.07, ry: d * 0.045, fill: color.ink });
  switch (g.kind) {
    case 'cat':
      for (const s of [1, -1]) {
        const ex = (f: number) => cx - s * d * f;
        out.push({
          t: 'poly',
          pts: [ex(0.44), y + d * 0.26, ex(0.38), y - d * 0.16, ex(0.08), y + d * 0.06],
          fill: fur,
        });
        out.push({
          t: 'poly',
          pts: [ex(0.37), y + d * 0.14, ex(0.34), y - d * 0.06, ex(0.18), y + d * 0.06],
          fill: PINK,
          alpha: 0.7,
        });
      }
      pinkNose();
      whiskers();
      break;
    case 'dog':
      for (const ex of [x + d * 0.03, x + d * 0.97]) {
        out.push({ t: 'ellipse', cx: ex, cy: y + d * 0.42, rx: d * 0.12, ry: d * 0.25, fill: fur });
        out.push({
          t: 'ellipse',
          cx: ex,
          cy: y + d * 0.42,
          rx: d * 0.12,
          ry: d * 0.25,
          fill: color.ink,
          alpha: 0.22,
        });
      }
      darkNose();
      break;
    case 'bear':
      for (const ex of [x + d * 0.16, x + d * 0.84]) {
        out.push({ t: 'ellipse', cx: ex, cy: y + d * 0.06, rx: d * 0.15, ry: d * 0.15, fill: fur });
        out.push({
          t: 'ellipse',
          cx: ex,
          cy: y + d * 0.06,
          rx: d * 0.08,
          ry: d * 0.08,
          fill: PINK,
          alpha: 0.6,
        });
      }
      darkNose();
      break;
    case 'bunny':
      for (const ex of [x + d * 0.32, x + d * 0.68]) {
        out.push({ t: 'ellipse', cx: ex, cy: y - d * 0.14, rx: d * 0.1, ry: d * 0.28, fill: fur });
        out.push({
          t: 'ellipse',
          cx: ex,
          cy: y - d * 0.12,
          rx: d * 0.05,
          ry: d * 0.2,
          fill: PINK,
          alpha: 0.7,
        });
      }
      pinkNose();
      break;
    case 'mouse':
      for (const ex of [x + d * 0.1, x + d * 0.9]) {
        out.push({ t: 'ellipse', cx: ex, cy: y + d * 0.1, rx: d * 0.19, ry: d * 0.19, fill: fur });
        out.push({
          t: 'ellipse',
          cx: ex,
          cy: y + d * 0.1,
          rx: d * 0.11,
          ry: d * 0.11,
          fill: PINK,
          alpha: 0.7,
        });
      }
      pinkNose();
      whiskers();
      break;
    default:
      break;
  }
  return out;
}

/** Shapes drawn over the face and hair (accessories). */
export function headExtras(g: PegGeometry, a: Appearance): Prim[] {
  const accent = a.accent ?? color.tomato;
  const { head, d } = g;
  const out: Prim[] = [...animalExtras(g, a), ...hairExtras(g, a)];
  if (g.freckles) {
    for (const c of g.cheeks) {
      for (const [fx, fy] of [
        [0.25, 0.3],
        [0.55, 0.15],
        [0.75, 0.55],
      ] as const) {
        const r = Math.max(0.8, d * 0.018);
        out.push({
          t: 'ellipse',
          cx: c.x + c.w * fx,
          cy: c.y + c.h * fy - d * 0.04,
          rx: r,
          ry: r,
          fill: freckleColour(a.skin),
          alpha: 0.7,
        });
      }
    }
  }
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
  } else if (g.accessory === 'headband') {
    out.push({
      t: 'rect',
      x: head.x + d * 0.02,
      y: head.y + d * 0.13,
      w: d * 0.96,
      h: d * 0.11,
      r: d * 0.055,
      fill: accent,
    });
  } else if (g.accessory === 'flower') {
    const cx = head.x + d * 0.8;
    const cy = head.y + d * 0.1;
    const pr = d * 0.075;
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      out.push({
        t: 'ellipse',
        cx: cx + Math.cos(ang) * pr * 1.1,
        cy: cy + Math.sin(ang) * pr * 1.1,
        rx: pr,
        ry: pr,
        fill: accent,
      });
    }
    out.push({ t: 'ellipse', cx, cy, rx: pr * 0.8, ry: pr * 0.8, fill: color.marigold });
  } else if (g.accessory === 'crown') {
    const l = head.x + d * 0.2;
    const r = head.x + d * 0.8;
    const base = head.y + d * 0.06;
    const top = head.y - d * 0.22;
    const mid = head.y - d * 0.06;
    const w = r - l;
    out.push({
      t: 'poly',
      pts: [
        l,
        base,
        l,
        top,
        l + w * 0.25,
        mid,
        l + w * 0.5,
        top - d * 0.04,
        l + w * 0.75,
        mid,
        r,
        top,
        r,
        base,
      ],
      fill: color.marigold,
    });
    out.push({
      t: 'ellipse',
      cx: l + w * 0.5,
      cy: base - d * 0.08,
      rx: d * 0.045,
      ry: d * 0.045,
      fill: accent,
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
