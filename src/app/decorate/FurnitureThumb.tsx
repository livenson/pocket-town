// A small picture of a piece of furniture, drawn from the same shapes as the stage.
import {
  furnitureKinds,
  type Corner4,
  type FurnitureKind,
  type FurnitureKindId,
  type Shape,
} from '../../content/furniture';

function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | Corner4 | undefined,
): string {
  const c: Corner4 =
    typeof r === 'number' || r === undefined ? [r ?? 0, r ?? 0, r ?? 0, r ?? 0] : r;
  const fit = (v: number) => Math.max(0, Math.min(v, w / 2, h / 2));
  const [tl, tr, br, bl] = [fit(c[0]), fit(c[1]), fit(c[2]), fit(c[3])];
  return (
    `M${x + tl} ${y}H${x + w - tr}A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}V${y + h - br}` +
    `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}H${x + bl}A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` +
    `V${y + tl}A${tl} ${tl} 0 0 1 ${x + tl} ${y}Z`
  );
}

export function FurnitureThumb({ kind, size = 64 }: { kind: FurnitureKindId; size?: number }) {
  const k: FurnitureKind = furnitureKinds[kind];
  const pad = 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-pad} ${-pad} ${Math.max(k.w, k.h) + pad * 2} ${Math.max(k.w, k.h) + pad * 2}`}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`translate(${(Math.max(k.w, k.h) - k.w) / 2} ${Math.max(k.w, k.h) - k.h})`}>
        {k.shapes.map((s: Shape, i) => {
          const stroke = s.stroke
            ? {
                stroke: s.stroke.color,
                strokeWidth: s.stroke.width,
                strokeLinejoin: 'round' as const,
              }
            : {};
          if (s.kind === 'ellipse') {
            return (
              <ellipse
                key={i}
                cx={s.x + s.w / 2}
                cy={s.y + s.h / 2}
                rx={s.w / 2}
                ry={s.h / 2}
                fill={s.fill}
                fillOpacity={s.alpha}
                {...stroke}
              />
            );
          }
          return (
            <path
              key={i}
              d={roundedRect(s.x, s.y, s.w, s.h, s.r)}
              fill={s.fill}
              fillOpacity={s.alpha}
              {...stroke}
            />
          );
        })}
      </g>
    </svg>
  );
}
