// Little buildings for the world map, drawn in the house style: flat colours, ink
// outlines, a door and windows, a roof that says what kind of place it is.
import type { BuildingDef } from '../content/rooms';
import { color } from '../design/tokens';

const INK = color.ink;
const LINE = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const };

function Window({ x, y, w = 18, h = 16 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color.sky} {...LINE} />
      <path d={`M${x + w / 2} ${y}v${h}`} stroke={INK} strokeWidth={3} />
    </g>
  );
}

function Door({
  x,
  y,
  h = 30,
  fill = color.woodDark,
}: {
  x: number;
  y: number;
  h?: number;
  fill?: string;
}) {
  return (
    <g>
      <path d={`M${x} ${y + h}V${y + 9}a9 9 0 0 1 18 0V${y + h}Z`} fill={fill} {...LINE} />
      <circle cx={x + 13} cy={y + h * 0.6} r={2} fill={color.marigold} />
    </g>
  );
}

function House({ shape, roof }: { shape: 'cottage' | 'tall' | 'dome'; roof: string }) {
  if (shape === 'tall')
    return (
      <g>
        <rect x={32} y={36} width={64} height={66} rx={6} fill={color.paper} {...LINE} />
        <path d="M24 42L64 6L104 42Z" fill={roof} {...LINE} />
        <Window x={40} y={50} w={16} h={14} />
        <Window x={72} y={50} w={16} h={14} />
        <Window x={40} y={74} w={16} h={14} />
        <Door x={66} y={72} />
      </g>
    );
  if (shape === 'dome')
    return (
      <g>
        <rect x={20} y={56} width={88} height={46} rx={6} fill={color.paper} {...LINE} />
        <path d="M14 60A50 46 0 0 1 114 60Z" fill={roof} {...LINE} />
        <circle cx={64} cy={36} r={8} fill={color.sky} {...LINE} />
        <Window x={30} y={68} />
        <Window x={80} y={68} />
        <Door x={55} y={72} />
      </g>
    );
  return (
    <g>
      <rect x={84} y={18} width={13} height={26} rx={2} fill={color.woodDark} {...LINE} />
      <rect x={20} y={50} width={88} height={52} rx={6} fill={color.paper} {...LINE} />
      <path d="M10 56L64 14L118 56Z" fill={roof} {...LINE} />
      <Window x={29} y={64} />
      <Window x={81} y={64} />
      <Door x={55} y={72} />
    </g>
  );
}

function Cafe({ roof }: { roof: string }) {
  const stripes = [0, 1, 2, 3, 4, 5];
  return (
    <g>
      <rect x={16} y={42} width={96} height={60} rx={6} fill={color.paper} {...LINE} />
      <rect x={10} y={30} width={108} height={14} rx={5} fill={roof} {...LINE} />
      {stripes.map((i) => (
        <path
          key={i}
          d={`M${16 + i * 16} 44h16v12a8 8 0 0 1 -16 0Z`}
          fill={i % 2 ? '#FFFFFF' : roof}
          {...LINE}
          strokeWidth={3}
        />
      ))}
      <rect x={24} y={68} width={44} height={26} rx={4} fill={color.sky} {...LINE} />
      <Door x={80} y={70} h={32} fill={color.teal} />
    </g>
  );
}

function Library({ roof }: { roof: string }) {
  return (
    <g>
      <rect x={18} y={48} width={92} height={50} fill={color.paper} {...LINE} />
      {[24, 40, 78, 94].map((x) => (
        <rect
          key={x}
          x={x}
          y={52}
          width={10}
          height={44}
          rx={3}
          fill="#FFFFFF"
          {...LINE}
          strokeWidth={3}
        />
      ))}
      <path d="M8 50L64 14L120 50Z" fill={roof} {...LINE} />
      <circle cx={64} cy={36} r={6} fill={color.paper} {...LINE} strokeWidth={3} />
      <Door x={55} y={66} h={32} />
      <rect x={8} y={96} width={112} height={8} rx={3} fill={color.peach} {...LINE} />
    </g>
  );
}

function MusicHall({ roof }: { roof: string }) {
  return (
    <g>
      <path d="M64 4v12" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={64} cy={6} r={5} fill={color.marigold} {...LINE} strokeWidth={3} />
      <rect x={20} y={54} width={88} height={48} rx={6} fill={color.paper} {...LINE} />
      <path d="M14 58A50 44 0 0 1 114 58Z" fill={roof} {...LINE} />
      <circle cx={64} cy={36} r={9} fill={color.sky} {...LINE} />
      <Window x={28} y={64} />
      <Window x={82} y={64} />
      <Door x={55} y={72} />
    </g>
  );
}

function Park({ roof }: { roof: string }) {
  return (
    <g>
      <rect x={24} y={58} width={8} height={30} rx={3} fill={color.woodDeep} />
      <rect x={96} y={58} width={8} height={30} rx={3} fill={color.woodDeep} />
      <circle cx={28} cy={48} r={22} fill={color.tree} {...LINE} />
      <circle cx={100} cy={48} r={22} fill={color.tree} {...LINE} />
      <path
        d="M40 102V70a24 24 0 0 1 48 0V102"
        fill="none"
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M40 102V70a24 24 0 0 1 48 0V102"
        fill="none"
        stroke={roof}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <rect x={8} y={88} width={112} height={14} rx={7} fill={color.leaf} {...LINE} />
    </g>
  );
}

/** A building as seen from the street, 128 × 112. */
export function BuildingArt({ b }: { b: BuildingDef }) {
  const art =
    b.kind === 'cafe' ? (
      <Cafe roof={b.roofColor} />
    ) : b.kind === 'library' ? (
      <Library roof={b.roofColor} />
    ) : b.kind === 'musicHall' ? (
      <MusicHall roof={b.roofColor} />
    ) : b.kind === 'park' ? (
      <Park roof={b.roofColor} />
    ) : (
      <House shape={b.shape ?? 'cottage'} roof={b.roofColor} />
    );
  return (
    <svg
      className="map-building__art"
      viewBox="0 0 128 112"
      width={128}
      height={112}
      aria-hidden="true"
    >
      <ellipse cx={64} cy={104} rx={56} ry={7} fill={INK} opacity={0.14} />
      {art}
    </svg>
  );
}
