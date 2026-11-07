// A peg-folk character as SVG, from the same geometry the stage uses. For docks,
// cards, the gallery and the avatar wizard.
import type { Appearance, Eyes } from '../content/appearance';
import { color } from '../design/tokens';
import { bodyExtras, headExtras, mouthPrims, type Prim } from '../stage/peg/extras';
import { pegGeometry, type Box, type Corners } from '../stage/peg/geometry';

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
  const ink = color.ink;
  const viewBox =
    crop === 'head' ? `${-8} ${-6} ${g.W + 16} ${g.W + 16}` : `${-4} ${-24} ${g.RW + 8} ${H + 28}`;
  const [vbW, vbH] = crop === 'head' ? [g.W + 16, g.W + 16] : [g.RW + 8, H + 28];
  const hr = g.d / 2;
  const hcx = g.head.x + hr;
  const hcy = g.head.y + hr;
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
      <path d={ellipticalRectPath(g.body, g.bodyCorners)} fill={a.outfit} />
      <clipPath id={`body-${a.outfit}-${a.kind ?? 'person'}`}>
        <path d={ellipticalRectPath(g.body, g.bodyCorners)} />
      </clipPath>
      <g clipPath={`url(#body-${a.outfit}-${a.kind ?? 'person'})`}>
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
      <Prims prims={bodyExtras(g, a)} />
      <circle cx={hcx} cy={hcy} r={hr} fill={a.skin} />
      <clipPath id={`head-${a.skin}`}>
        <circle cx={hcx} cy={hcy} r={hr} />
      </clipPath>
      <g clipPath={`url(#head-${a.skin})`}>
        <path
          d={`M${hcx - hr - 2} ${hcy - hr - 2}h${g.d + 4}v${g.d + 4}h${-(g.d + 4)}Z M${hcx - g.d * 0.07 + hr} ${hcy - g.d * 0.06}a${hr} ${hr} 0 1 0 ${-2 * hr} 0a${hr} ${hr} 0 1 0 ${2 * hr} 0Z`}
          fill={ink}
          opacity={0.12}
          fillRule="evenodd"
        />
      </g>
      {g.cap && <path d={ellipticalRectPath(g.cap, g.capCorners)} fill={a.hair} />}
      {g.locks?.map((l, i) => (
        <path key={i} d={ellipticalRectPath(l, pct(l, 0.4, 0.45))} fill={a.hair} />
      ))}
      {g.eyes.map((e, i) =>
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
      )}
      {g.cheeks.map((c, i) => (
        <Ellipse key={i} b={c} fill="#FF6978" opacity={0.42} />
      ))}
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
      <Prims prims={headExtras(g, a)} />
    </svg>
  );
}
