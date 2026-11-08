// A peg-folk character as SVG, from the same geometry the stage uses. For docks,
// cards, the gallery and the avatar wizard.
import { useId } from 'react';
import type { Appearance, Eyes } from '../content/appearance';
import { color } from '../design/tokens';
import { bodyExtras, headExtras, mouthPrims, type Prim } from '../stage/peg/extras';
import { pegGeometry, type Box, type Corners } from '../stage/peg/geometry';
import {
  beardPrims,
  browPrims,
  detailedEyes,
  earPrims,
  eyePrims,
  fringePrims,
  nosePrims,
  tattooPrims,
} from '../stage/peg/face';
import {
  armPrims,
  backPrims,
  bodyFill,
  clothesPrims,
  detailPrims,
  hairShinePrims,
  helmetPrims,
  lashPrims,
} from '../stage/peg/outfit';

const K = 0.5523;
const n = (v: number) => v.toFixed(2);
const scale4 = (
  r: [number, number, number, number],
  f: number,
): [number, number, number, number] => [r[0] * f, r[1] * f, r[2] * f, r[3] * f];

function ellipticalRectPath(b: Box, c: Corners, dx = 0): string {
  const x = b.x + dx;
  const { y, w, h } = b;
  const f = Math.min(
    1,
    w / (c.rx[0] + c.rx[1] || 1),
    w / (c.rx[3] + c.rx[2] || 1),
    h / (c.ry[0] + c.ry[3] || 1),
    h / (c.ry[1] + c.ry[2] || 1),
  );
  const [tlx, trx, brx, blx] = scale4(c.rx, f);
  const [tly, tr_y, bry, bly] = scale4(c.ry, f);
  return [
    `M${n(x + tlx)} ${n(y)}`,
    `L${n(x + w - trx)} ${n(y)}`,
    `C${n(x + w - trx + trx * K)} ${n(y)} ${n(x + w)} ${n(y + tr_y - tr_y * K)} ${n(x + w)} ${n(y + tr_y)}`,
    `L${n(x + w)} ${n(y + h - bry)}`,
    `C${n(x + w)} ${n(y + h - bry + bry * K)} ${n(x + w - brx + brx * K)} ${n(y + h)} ${n(x + w - brx)} ${n(y + h)}`,
    `L${n(x + blx)} ${n(y + h)}`,
    `C${n(x + blx - blx * K)} ${n(y + h)} ${n(x)} ${n(y + h - bly + bly * K)} ${n(x)} ${n(y + h - bly)}`,
    `L${n(x)} ${n(y + tly)}`,
    `C${n(x)} ${n(y + tly - tly * K)} ${n(x + tlx - tlx * K)} ${n(y)} ${n(x + tlx)} ${n(y)}Z`,
  ].join('');
}

/** An SVG path through x, y pairs. */
function polyPath(pts: number[]): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2)
    d += `${i === 0 ? 'M' : 'L'}${n(pts[i] ?? 0)} ${n(pts[i + 1] ?? 0)}`;
  return `${d}Z`;
}

const pct = (b: Box, px: number, py = px): Corners => ({
  rx: [px * b.w, px * b.w, px * b.w, px * b.w],
  ry: [py * b.h, py * b.h, py * b.h, py * b.h],
});

const Ellipse = ({ b, fill, opacity }: { b: Box; fill: string; opacity?: number }) => (
  <ellipse
    cx={b.x + b.w / 2}
    cy={b.y + b.h / 2}
    rx={b.w / 2}
    ry={b.h / 2}
    fill={fill}
    opacity={opacity}
  />
);

function Prims({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p, i) => {
        if (p.t === 'rect') {
          return (
            <rect
              key={i}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={p.r}
              fill={p.fill}
              opacity={p.alpha}
            />
          );
        }
        if (p.t === 'poly')
          return <polygon key={i} points={p.pts.join(' ')} fill={p.fill} opacity={p.alpha} />;
        if (p.t === 'line') {
          return (
            <line
              key={i}
              x1={p.x1}
              y1={p.y1}
              x2={p.x2}
              y2={p.y2}
              stroke={p.stroke}
              strokeWidth={p.sw}
              strokeLinecap="round"
            />
          );
        }
        return (
          <ellipse
            key={i}
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            fill={p.fill ?? 'none'}
            stroke={p.stroke}
            strokeWidth={p.sw}
            opacity={p.alpha}
          />
        );
      })}
    </>
  );
}

export interface PegPortraitProps {
  appearance: Appearance;
  eyes?: Eyes;
  /** Rendered height in CSS px. */
  size: number;
  /** Show only the head and shoulders (dock portraits). */
  crop?: 'full' | 'head';
}

/** Decorative: the control around it carries the name. */
export function PegPortrait({
  appearance: a,
  eyes = 'open',
  size,
  crop = 'full',
}: PegPortraitProps) {
  const H = 150;
  const g = pegGeometry(H, a, eyes);
  // Unique per portrait: several portraits of different shapes share a page.
  const uid = useId().replace(/:/g, '');
  const ink = color.ink;
  const viewBox =
    crop === 'head'
      ? `${-8} ${-6} ${g.W + 16} ${g.W + 16}`
      : `${g.left - 4} ${-24} ${g.RW + 8} ${H + 28}`;
  const [vbW, vbH] = crop === 'head' ? [g.W + 16, g.W + 16] : [g.RW + 8, H + 28];
  const hr = g.d / 2;
  const hcx = g.head.x + hr;
  const hcy = g.head.y + hr;
  const { headRx: rx, headRy: ry } = g;
  // The lit part of the face: the outline moved up and left; the rest is shade.
  const shadePath = polyPath(
    g.headPoly.map((v, i) => v + (i % 2 === 0 ? -g.d * 0.07 : -g.d * 0.06)),
  );
  const m = g.mouth;
  const my = m.y + m.h * 0.35;
  return (
    <svg
      width={(size * vbW) / vbH}
      height={size}
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      className="peg-portrait"
    >
      {g.top && <Ellipse b={g.top} fill={a.hair} />}
      <Prims prims={backPrims(g, a)} />
      <path d={ellipticalRectPath(g.body, g.bodyCorners)} fill={bodyFill(g, a)} />
      <clipPath id={`body-${uid}`}>
        <path d={ellipticalRectPath(g.body, g.bodyCorners)} />
      </clipPath>
      <g clipPath={`url(#body-${uid})`}>
        <rect x={0} y={g.body.y} width={g.W * 0.09} height={g.body.h} fill="#fff" opacity={0.2} />
        <rect
          x={g.W * 0.92}
          y={g.body.y}
          width={g.W * 0.08}
          height={g.body.h}
          fill={ink}
          opacity={0.12}
        />
      </g>
      <rect
        x={g.band.x}
        y={g.band.y}
        width={g.band.w}
        height={g.band.h}
        rx={g.band.h / 2}
        fill={ink}
        opacity={0.22}
      />
      <Prims prims={clothesPrims(g, a)} />
      <Prims prims={detailPrims(g, a)} />
      <Prims prims={bodyExtras(g, a)} />
      <Prims prims={armPrims(g, a)} />
      <Prims prims={tattooPrims(g, a, 'arm')} />
      <Prims prims={earPrims(g, a)} />
      <polygon points={g.headPoly.join(' ')} fill={a.skin} />
      <clipPath id={`head-${uid}`}>
        <polygon points={g.headPoly.join(' ')} />
      </clipPath>
      <g clipPath={`url(#head-${uid})`}>
        <path
          d={`M${hcx - rx - 4} ${hcy - ry - 4}h${2 * rx + 8}v${2 * ry + 8}h${-(2 * rx + 8)}Z ${shadePath}`}
          fill={ink}
          opacity={0.12}
          fillRule="evenodd"
        />
      </g>
      {g.cap && <path d={ellipticalRectPath(g.cap, g.capCorners)} fill={a.hair} />}
      {g.locks?.map((l, i) => (
        <path key={i} d={ellipticalRectPath(l, pct(l, 0.4, 0.45))} fill={a.hair} />
      ))}
      <Prims prims={hairShinePrims(g)} />
      <Prims prims={fringePrims(g, a)} />
      {detailedEyes(g, a) ? (
        <Prims prims={eyePrims(g, a)} />
      ) : (
        g.eyes.map((e, i) =>
          g.eyeShape === 'bar' ? (
            <rect
              key={i}
              x={e.x}
              y={e.y}
              width={e.w}
              height={e.h}
              rx={Math.min(3, e.h / 2)}
              fill={ink}
            />
          ) : (
            <Ellipse key={i} b={e} fill={ink} />
          ),
        )
      )}
      <Prims prims={browPrims(g, a)} />
      <Prims prims={lashPrims(g)} />
      {a.face?.blush !== false &&
        g.cheeks.map((c, i) => <Ellipse key={i} b={c} fill="#FF6978" opacity={0.42} />)}
      <Prims prims={tattooPrims(g, a, 'cheek')} />
      <Prims prims={nosePrims(g, a)} />
      <Prims prims={beardPrims(g, a, 'under')} />
      {mouthPrims(g) ? (
        <Prims prims={mouthPrims(g) ?? []} />
      ) : g.mouthShape === 'o' ? (
        <ellipse
          cx={m.x + m.w / 2}
          cy={m.y + m.h / 2}
          rx={m.w / 2 - g.lineWidth / 2}
          ry={m.h / 2 - g.lineWidth / 2}
          fill="none"
          stroke={ink}
          strokeWidth={g.lineWidth * 0.9}
        />
      ) : (
        <path
          d={`M${m.x} ${my}C${m.x} ${my + m.h * 1.1} ${m.x + m.w} ${my + m.h * 1.1} ${m.x + m.w} ${my}`}
          fill="none"
          stroke={ink}
          strokeWidth={g.lineWidth}
          strokeLinecap="round"
        />
      )}
      <Prims prims={beardPrims(g, a, 'over')} />
      <Prims prims={headExtras(g, a)} />
      <Prims prims={helmetPrims(g, a)} />
    </svg>
  );
}
