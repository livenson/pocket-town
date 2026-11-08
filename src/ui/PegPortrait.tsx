// A peg-folk character as SVG, from the same geometry the stage uses. For docks,
// cards, the gallery and the avatar wizard.
import { useId } from 'react';
import type { Appearance, Eyes } from '../content/appearance';
import { color } from '../design/tokens';
import { headExtras, mouthPrims, type Prim } from '../stage/peg/extras';
import type { Box, Corners, PegGeometry } from '../stage/peg/geometry';
import {
  boneMatrices,
  buildRig,
  headGeometry,
  lineWidthFor,
  outlineOf,
  REST,
  type Angles,
  type Mat,
} from '../stage/peg/rig';
import type { LiveFace } from '../photo/liveFace';
import {
  beardPrims,
  browColour,
  browPrims,
  browY,
  detailedEyes,
  eyeHalfHeight,
  earPrims,
  eyePrims,
  fringePrims,
  nosePrims,
  tattooPrims,
} from '../stage/peg/face';
import { hairShinePrims, helmetPrims, lashPrims } from '../stage/peg/outfit';

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
              stroke={p.stroke}
              strokeWidth={p.sw}
            />
          );
        }
        if (p.t === 'poly')
          return (
            <polygon
              key={i}
              points={p.pts.join(' ')}
              fill={p.fill}
              opacity={p.alpha}
              stroke={p.stroke}
              strokeWidth={p.sw}
              strokeLinejoin="round"
            />
          );
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
  /**
   * Show only the head and shoulders (dock portraits), or the full figure with
   * room for arms held out to the sides (the camera mirror).
   */
  crop?: 'full' | 'head' | 'reach';
  /** The live mirror (camera screen): a continuous expression and head pose. */
  live?: LiveFace;
  /** Joint angles (rig.ts); standing at rest when missing. */
  pose?: Angles;
}

/** Brows that lift and knit with the live expression (thin ones if none were chosen). */
function LiveBrows({
  g,
  a,
  live,
  wide,
}: {
  g: PegGeometry;
  a: Appearance;
  live: LiveFace;
  wide: number;
}) {
  const style = a.face?.brows ?? 'thin';
  const fill = browColour(a);
  const sw = g.lineWidth * (style === 'thick' ? 1.7 : 0.9);
  const half = g.d * 0.075;
  return (
    <>
      {g.eyes.map((e, i) => {
        const v = i === 0 ? live.browL : live.browR;
        const cx = e.x + e.w / 2;
        // Never lower than just above the eye, however wide it opens.
        const eyeTop = e.y + e.h / 2 - eyeHalfHeight(g, a, e) * wide;
        const y = Math.min(browY(g) - v * g.d * 0.06, eyeTop - sw * 1.2);
        // Inner end (towards the nose) dips when knitted, lifts when worried.
        const inner = i === 0 ? 1 : -1;
        const tilt = -v * g.d * 0.025;
        const x1 = cx - inner * half;
        const x2 = cx + inner * half;
        if (style === 'arched')
          return (
            <polyline
              key={i}
              points={`${x1},${y + g.d * 0.02} ${cx},${y - g.d * 0.025 + tilt / 2} ${x2},${y + tilt}`}
              fill="none"
              stroke={fill}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        return (
          <line
            key={i}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y + tilt}
            stroke={fill}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

/** A mouth drawn from a live expression: smile, frown, open jaw, pucker. */
function LiveMouth({ m, live, lw, d }: { m: Box; live: LiveFace; lw: number; d: number }) {
  const cx = m.x + m.w / 2;
  const y0 = m.y + m.h * 0.35;
  const smile = Math.max(0, live.smile);
  const frown = Math.max(0, -live.smile);
  const half = (m.w / 2) * (1 + 0.45 * smile - 0.5 * live.pucker);
  const cornerY = y0 - smile * m.h * 0.35 + frown * m.h * 0.9;
  const openH = live.open * d * 0.2;
  const lowMid = y0 + m.h * (0.15 + 0.9 * smile) - frown * m.h * 0.5 + openH;
  const upMid = y0 + m.h * 0.05 * smile - openH * 0.15;
  if (live.pucker > 0.55 && live.open < 0.3)
    return (
      <ellipse
        cx={cx}
        cy={y0 + m.h * 0.3}
        rx={Math.max(lw, half * 0.45)}
        ry={Math.max(lw, half * 0.5)}
        fill="none"
        stroke={color.ink}
        strokeWidth={lw}
      />
    );
  if (openH > d * 0.025 || smile > 0.65) {
    const lowCtrl = 2 * lowMid - cornerY;
    const upCtrl = 2 * upMid - cornerY;
    return (
      <g>
        <path
          d={`M${cx - half} ${cornerY}Q${cx} ${upCtrl} ${cx + half} ${cornerY}Q${cx} ${lowCtrl} ${cx - half} ${cornerY}Z`}
          fill={color.ink}
          stroke={color.ink}
          strokeWidth={lw * 0.6}
          strokeLinejoin="round"
        />
        {openH > d * 0.06 && (
          <ellipse
            cx={cx}
            cy={lowMid - openH * 0.28}
            rx={half * 0.5}
            ry={openH * 0.28}
            fill="#FF8FA8"
          />
        )}
      </g>
    );
  }
  return (
    <path
      d={`M${cx - half} ${cornerY}Q${cx} ${2 * lowMid - cornerY} ${cx + half} ${cornerY}`}
      fill="none"
      stroke={color.ink}
      strokeWidth={lw}
      strokeLinecap="round"
    />
  );
}

/** Decorative: the control around it carries the name. */
export function PegPortrait({
  appearance: a,
  eyes = 'open',
  size,
  crop = 'full',
  live,
  pose = REST,
}: PegPortraitProps) {
  const S = 150;
  const g = headGeometry(S, a, eyes);
  const rig = buildRig(S, a);
  const mats = boneMatrices(rig, pose);
  // Unique per portrait: several portraits of different shapes share a page.
  const uid = useId().replace(/:/g, '');
  const ink = color.ink;
  // Full figure: wide enough for a cape and hands; tall enough for a puff or a crown.
  const [vbX, vbY, vbW, vbH] =
    crop === 'head'
      ? [-0.27 * S, -0.97 * S, 0.54 * S, 0.54 * S]
      : crop === 'reach'
        ? [-0.45 * S, -1.08 * S, 0.9 * S, 1.11 * S]
        : [-0.3 * S, -1.08 * S, 0.6 * S, 1.11 * S];
  const viewBox = [vbX, vbY, vbW, vbH].map(n).join(' ');
  const hr = g.d / 2;
  const hcx = g.head.x + hr;
  const hcy = g.head.y + hr;
  const { headRx: rx, headRy: ry } = g;
  const chin = g.head.y + ry * 2;
  // The lit part of the face: the outline moved up and left; the rest is shade.
  const shadePath = polyPath(
    g.headPoly.map((v, i) => v + (i % 2 === 0 ? -g.d * 0.07 : -g.d * 0.06)),
  );
  const m = g.mouth;
  const my = m.y + m.h * 0.35;
  // Live mirror: the head tilts at the neck and the face shifts as it turns.
  const headTurn = live
    ? `rotate(${((live.roll * 180) / Math.PI).toFixed(2)} ${hcx} ${chin})`
    : undefined;
  const faceShift = live ? `translate(${(live.yaw * g.d * 0.1).toFixed(2)} 0)` : undefined;
  /** Eyes open wider when surprised (raised brows, open mouth). */
  const wide = live ? 1 + 0.25 * Math.max(0, (live.browL + live.browR) / 2) + 0.15 * live.open : 1;
  const lashes = lashPrims(g);
  /** Squash an eye vertically by its blink (and open it wider when surprised). */
  const eyeScale = (i: number, e: Box) => {
    if (!live) return undefined;
    const blink = i === 0 ? live.blinkL : live.blinkR;
    const sy = Math.max(0.08, (1 - blink) * wide);
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    return `translate(${cx} ${cy}) scale(${wide.toFixed(3)} ${sy.toFixed(3)}) translate(${-cx} ${-cy})`;
  };
  const detailed = detailedEyes(g, a);
  const eyeParts = detailed ? eyePrims(g, a) : [];
  const perEye = eyeParts.length / 2;
  const head = (
    <g transform={`${matrix(mats.head)} translate(${n(-rig.headPivot.x)} ${n(-rig.headPivot.y)})`}>
      <g transform={headTurn}>
        {g.top && <Ellipse b={g.top} fill={a.hair} />}
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
        <polygon
          points={g.headPoly.join(' ')}
          fill="none"
          stroke={outlineOf(a.skin)}
          strokeWidth={lineWidthFor(S)}
        />
        {g.cap && <path d={ellipticalRectPath(g.cap, g.capCorners)} fill={a.hair} />}
        {g.locks?.map((l, i) => (
          <path key={i} d={ellipticalRectPath(l, pct(l, 0.4, 0.45))} fill={a.hair} />
        ))}
        <Prims prims={hairShinePrims(g)} />
        <Prims prims={fringePrims(g, a)} />
        <g transform={faceShift}>
          {g.eyes.map((e, i) => (
            <g key={i} transform={eyeScale(i, e)}>
              {detailed ? (
                <Prims prims={eyeParts.slice(i * perEye, (i + 1) * perEye)} />
              ) : g.eyeShape === 'bar' ? (
                <rect
                  x={e.x}
                  y={e.y}
                  width={e.w}
                  height={e.h}
                  rx={Math.min(3, e.h / 2)}
                  fill={ink}
                />
              ) : (
                <Ellipse b={e} fill={ink} />
              )}
              {/* Lashes belong to their eye: they blink and widen with it. */}
              <Prims prims={lashes.slice(i * 2, i * 2 + 2)} />
            </g>
          ))}
          {live ? (
            <LiveBrows g={g} a={a} live={live} wide={wide} />
          ) : (
            <Prims prims={browPrims(g, a)} />
          )}
          {a.face?.blush !== false &&
            g.cheeks.map((c, i) => {
              const puff = live?.puff ?? 0;
              const b =
                puff > 0
                  ? {
                      x: c.x - c.w * puff * 0.4,
                      y: c.y - c.h * puff * 0.4,
                      w: c.w * (1 + puff * 0.8),
                      h: c.h * (1 + puff * 0.8),
                    }
                  : c;
              return <Ellipse key={i} b={b} fill="#FF6978" opacity={0.42 + 0.3 * puff} />;
            })}
          <Prims prims={tattooPrims(g, a, 'cheek')} />
          <Prims prims={nosePrims(g, a)} />
          <Prims prims={beardPrims(g, a, 'under')} />
          {live ? (
            <LiveMouth m={m} live={live} lw={g.lineWidth} d={g.d} />
          ) : mouthPrims(g) ? (
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
        </g>
        <Prims prims={headExtras(g, a)} />
        <Prims prims={helmetPrims(g, a)} />
      </g>
    </g>
  );
  return (
    <svg
      width={(size * vbW) / vbH}
      height={size}
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      className="peg-portrait"
    >
      {rig.parts.map((p, i) =>
        'only' in p && p.only ? null : 'head' in p ? (
          <g key={i}>{head}</g>
        ) : (
          <g key={i} transform={matrix(mats[p.bone])}>
            <Prims prims={p.prims} />
          </g>
        ),
      )}
    </svg>
  );
}

const matrix = (m: Mat) => `matrix(${[m.a, m.b, m.c, m.d, m.tx, m.ty].map(n).join(' ')})`;
