// Advanced face detail on a peg-folk character (ears, fringe, eyes with irises,
// brows, nose, beard, play tattoos) as simple shapes, so the Pixi stage and the
// SVG portraits draw the same face. Everything here is optional: a face without
// detail draws exactly as the classic peg.
import type { Appearance, FaceDetail, Tattoo } from '../../content/appearance';
import { color } from '../../design/tokens';
import { badge, type Prim } from './extras';
import type { PegGeometry } from './geometry';
import { mix } from './outfit';

const face = (a: Appearance): FaceDetail => a.face ?? {};
const centre = (g: PegGeometry) => ({ cx: g.head.x + g.d / 2, cy: g.head.y + g.d / 2 });

/** Ears at the sides of the head (people only), drawn behind the head. */
export function earPrims(g: PegGeometry, a: Appearance): Prim[] {
  if (!face(a).ears || g.kind !== 'person') return [];
  const { cx, cy } = centre(g);
  const out: Prim[] = [];
  for (const side of [-1, 1]) {
    const ex = cx + side * g.headRx * 0.97;
    const ey = cy + g.d * 0.05;
    out.push({ t: 'ellipse', cx: ex, cy: ey, rx: g.d * 0.1, ry: g.d * 0.13, fill: a.skin });
    out.push({
      t: 'ellipse',
      cx: ex + side * g.d * 0.01,
      cy: ey,
      rx: g.d * 0.05,
      ry: g.d * 0.075,
      fill: mix(a.skin, color.ink, 0.2),
      alpha: 0.6,
    });
  }
  return out;
}

/** A fringe over the forehead, in the hair colour (after the hair cap). */
export function fringePrims(g: PegGeometry, a: Appearance): Prim[] {
  const f = face(a).fringe ?? 'none';
  if (f === 'none' || !g.cap) return [];
  const { head, d } = g;
  const top = g.cap.y + g.cap.h - d * 0.06;
  if (f === 'straight')
    return [
      {
        t: 'rect',
        x: head.x + d * 0.14,
        y: top,
        w: d * 0.72,
        h: d * 0.15,
        r: d * 0.05,
        fill: a.hair,
      },
    ];
  return [
    {
      t: 'poly',
      pts: [
        head.x + d * 0.12,
        top,
        head.x + d * 0.88,
        top,
        head.x + d * 0.8,
        top + d * 0.08,
        head.x + d * 0.3,
        top + d * 0.2,
      ],
      fill: a.hair,
    },
  ];
}

/** True when the eyes are drawn with whites and irises instead of dots. */
export function detailedEyes(g: PegGeometry, a: Appearance): boolean {
  const style = face(a).eyes ?? 'dots';
  return style !== 'dots' && g.eyeShape !== 'bar';
}

/** Eyes with a white, a coloured iris, a pupil and a highlight. */
export function eyePrims(g: PegGeometry, a: Appearance): Prim[] {
  if (!detailedEyes(g, a)) return [];
  const almond = face(a).eyes === 'almond';
  const iris = face(a).eyeColour ?? '#6B4A2E';
  const out: Prim[] = [];
  const s = g.eyeScale * (g.eyeShape === 'oval' ? 1.2 : 1);
  for (const e of g.eyes) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const rx = g.d * (almond ? 0.092 : 0.076) * s;
    const ry = g.d * (almond ? 0.054 : 0.07) * s;
    out.push({
      t: 'ellipse',
      cx,
      cy,
      rx,
      ry,
      fill: '#FFFFFF',
      stroke: color.ink,
      sw: Math.max(0.7, g.lineWidth * 0.3),
    });
    const ir = Math.min(rx, ry) * 0.9;
    out.push({ t: 'ellipse', cx, cy: cy + ry * 0.05, rx: ir, ry: ir, fill: iris });
    out.push({ t: 'ellipse', cx, cy: cy + ry * 0.05, rx: ir * 0.5, ry: ir * 0.5, fill: color.ink });
    out.push({
      t: 'ellipse',
      cx: cx - ir * 0.35,
      cy: cy - ir * 0.3,
      rx: ir * 0.28,
      ry: ir * 0.28,
      fill: '#FFFFFF',
    });
  }
  return out;
}

/** Eyebrows in the hair colour (ink when there is no hair). */
export function browPrims(g: PegGeometry, a: Appearance): Prim[] {
  const b = face(a).brows ?? 'none';
  if (b === 'none') return [];
  const fill = a.hairStyle === 'none' ? mix(a.skin, color.ink, 0.55) : a.hair;
  const sw = g.lineWidth * (b === 'thick' ? 1.7 : 0.9);
  const out: Prim[] = [];
  for (const [i, e] of g.eyes.entries()) {
    const cx = e.x + e.w / 2;
    const y = g.head.y + g.d * 0.47 - g.d * 0.11 * Math.max(1, g.eyeScale);
    const half = g.d * 0.075;
    const inner = i === 0 ? 1 : -1;
    if (b === 'arched') {
      out.push({
        t: 'line',
        x1: cx - inner * half,
        y1: y + g.d * 0.02,
        x2: cx,
        y2: y - g.d * 0.025,
        stroke: fill,
        sw,
      });
      out.push({
        t: 'line',
        x1: cx,
        y1: y - g.d * 0.025,
        x2: cx + inner * half,
        y2: y + g.d * 0.005,
        stroke: fill,
        sw,
      });
    } else {
      out.push({ t: 'line', x1: cx - half, y1: y, x2: cx + half, y2: y, stroke: fill, sw });
    }
  }
  return out;
}

/** A small nose between the eyes and the mouth. */
export function nosePrims(g: PegGeometry, a: Appearance): Prim[] {
  const n = face(a).nose ?? 'none';
  if (n === 'none') return [];
  const { cx } = centre(g);
  // Between the eyes (0.47) and the mouth (0.64), clear of the mouth: a nose too
  // close above a smile reads as a moustache.
  const y = g.head.y + g.d * 0.565;
  const shade = mix(a.skin, color.ink, 0.15);
  if (n === 'dot')
    return [
      { t: 'ellipse', cx, cy: y, rx: g.d * 0.022, ry: g.d * 0.017, fill: color.ink, alpha: 0.4 },
    ];
  if (n === 'button')
    return [{ t: 'ellipse', cx, cy: y, rx: g.d * 0.045, ry: g.d * 0.032, fill: shade }];
  return [
    {
      t: 'rect',
      x: cx - g.d * 0.025,
      y: y - g.d * 0.09,
      w: g.d * 0.05,
      h: g.d * 0.12,
      r: g.d * 0.025,
      fill: shade,
    },
  ];
}

/** Beard under the mouth (the smile still shows), moustache over it. */
export function beardPrims(g: PegGeometry, a: Appearance, layer: 'under' | 'over'): Prim[] {
  const b = face(a).beard ?? 'none';
  if (b === 'none') return [];
  const { cx, cy } = centre(g);
  const d = g.d;
  const m = g.mouth;
  const out: Prim[] = [];
  if (layer === 'under') {
    if (b === 'stubble')
      out.push({
        t: 'ellipse',
        cx,
        cy: cy + d * 0.3,
        rx: d * 0.34,
        ry: d * 0.17,
        fill: a.hair,
        alpha: 0.28,
      });
    if (b === 'short')
      out.push({ t: 'ellipse', cx, cy: cy + d * 0.32, rx: d * 0.33, ry: d * 0.16, fill: a.hair });
    if (b === 'full') {
      out.push({ t: 'ellipse', cx, cy: cy + d * 0.33, rx: d * 0.42, ry: d * 0.27, fill: a.hair });
      out.push({
        t: 'rect',
        x: cx - d * 0.47,
        y: cy - d * 0.05,
        w: d * 0.12,
        h: d * 0.3,
        r: d * 0.05,
        fill: a.hair,
      });
      out.push({
        t: 'rect',
        x: cx + d * 0.35,
        y: cy - d * 0.05,
        w: d * 0.12,
        h: d * 0.3,
        r: d * 0.05,
        fill: a.hair,
      });
    }
    if (b === 'short' || b === 'full')
      // Room for the mouth: a little skin-coloured patch under the smile.
      out.push({
        t: 'ellipse',
        cx: m.x + m.w / 2,
        cy: m.y + m.h * 0.6,
        rx: m.w * 0.7,
        ry: m.h * 0.75,
        fill: a.skin,
      });
    return out;
  }
  if (b === 'moustache' || b === 'short' || b === 'full') {
    const my = m.y + m.h * 0.05;
    for (const side of [-1, 1])
      out.push({
        t: 'ellipse',
        cx: m.x + m.w / 2 + side * d * 0.065,
        cy: my,
        rx: d * 0.085,
        ry: d * 0.038,
        fill: a.hair,
      });
  }
  return out;
}

function tattooShape(kind: Tattoo, cx: number, cy: number, r: number, fill: string): Prim[] {
  const sw = Math.max(1.4, r * 0.32);
  switch (kind) {
    case 'heart':
    case 'star':
      return badge(kind, cx, cy, r, fill);
    case 'anchor':
      return [
        { t: 'line', x1: cx, y1: cy - r, x2: cx, y2: cy + r * 0.8, stroke: fill, sw },
        {
          t: 'line',
          x1: cx - r * 0.55,
          y1: cy - r * 0.45,
          x2: cx + r * 0.55,
          y2: cy - r * 0.45,
          stroke: fill,
          sw,
        },
        {
          t: 'line',
          x1: cx - r * 0.8,
          y1: cy + r * 0.3,
          x2: cx,
          y2: cy + r * 0.85,
          stroke: fill,
          sw,
        },
        {
          t: 'line',
          x1: cx + r * 0.8,
          y1: cy + r * 0.3,
          x2: cx,
          y2: cy + r * 0.85,
          stroke: fill,
          sw,
        },
      ];
    case 'bolt':
      return [
        {
          t: 'poly',
          pts: [
            cx + r * 0.25,
            cy - r,
            cx - r * 0.55,
            cy + r * 0.12,
            cx,
            cy + r * 0.12,
            cx - r * 0.25,
            cy + r,
            cx + r * 0.55,
            cy - r * 0.12,
            cx,
            cy - r * 0.12,
          ],
          fill,
        },
      ];
    case 'flower': {
      const out: Prim[] = [];
      for (let i = 0; i < 5; i++) {
        const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        out.push({
          t: 'ellipse',
          cx: cx + Math.cos(ang) * r * 0.55,
          cy: cy + Math.sin(ang) * r * 0.55,
          rx: r * 0.42,
          ry: r * 0.42,
          fill,
        });
      }
      out.push({ t: 'ellipse', cx, cy, rx: r * 0.32, ry: r * 0.32, fill: color.marigold });
      return out;
    }
    default:
      return [];
  }
}

/**
 * A play tattoo. On the arm it shows a bare forearm (short sleeves) with the
 * picture on it; on the cheek it sits on the right cheek.
 */
export function tattooPrims(g: PegGeometry, a: Appearance, place: 'arm' | 'cheek'): Prim[] {
  const f = face(a);
  const kind = f.tattoo ?? 'none';
  if (kind === 'none' || (f.tattooPlace ?? 'arm') !== place) return [];
  const fill = f.tattooColour ?? '#3D5AA8';
  if (place === 'cheek') {
    const c = g.cheeks[1];
    return tattooShape(kind, c.x + c.w * 0.55, c.y + c.h * 0.2, g.d * 0.06, fill);
  }
  if (g.clothes === 'space') return [];
  const { W, body } = g;
  const sw = W * 0.15;
  const sy = body.y + body.h * 0.2;
  const hy = body.y + body.h * 0.66;
  const out: Prim[] = [];
  // Forearms in skin from halfway down (short sleeves), for both arms.
  for (const [sx, hx] of [
    [W * 0.13, -W * 0.03],
    [W * 0.87, W * 1.03],
  ] as const) {
    const mx = (sx + hx) / 2;
    const my = (sy + hy) / 2;
    out.push({ t: 'line', x1: mx, y1: my, x2: hx, y2: hy, stroke: a.skin, sw: sw * 0.92 });
  }
  const tx = W * 0.03;
  const ty = body.y + body.h * 0.52;
  out.push(...tattooShape(kind, tx, ty, W * 0.055, fill));
  return out;
}
