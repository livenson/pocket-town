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

/** A white cross on a round badge: first aid (not the Red Cross emblem). */
function FirstAid({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const a = r * 0.55;
  const b = r * 0.2;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color.leaf} {...LINE} strokeWidth={3} />
      <path
        d={`M${cx - b} ${cy - a}h${2 * b}v${a - b}h${a - b}v${2 * b}h${b - a}v${a - b}h${-2 * b}v${b - a}h${b - a}v${-2 * b}h${a - b}Z`}
        fill="#FFFFFF"
      />
    </g>
  );
}

function Hospital({ roof }: { roof: string }) {
  return (
    <g>
      <rect x={14} y={38} width={100} height={64} rx={6} fill={color.paper} {...LINE} />
      <rect x={8} y={30} width={112} height={12} rx={5} fill={roof} {...LINE} />
      <FirstAid cx={64} cy={17} r={14} />
      <Window x={22} y={50} />
      <Window x={88} y={50} />
      <Window x={22} y={76} />
      <Window x={88} y={76} />
      <rect x={44} y={62} width={40} height={8} rx={3} fill={roof} {...LINE} strokeWidth={3} />
      <rect x={50} y={70} width={28} height={32} rx={3} fill={color.sky} {...LINE} />
      <path d="M64 70v32" stroke={INK} strokeWidth={3} />
    </g>
  );
}

function Workshop({ roof }: { roof: string }) {
  return (
    <g>
      <rect x={16} y={48} width={96} height={54} rx={4} fill={color.woodLight} {...LINE} />
      <path d="M8 52L40 22H88L120 52Z" fill={roof} {...LINE} />
      <circle cx={64} cy={38} r={9} fill={color.paper} {...LINE} strokeWidth={3} />
      <circle cx={64} cy={38} r={3} fill={INK} />
      <Window x={24} y={62} />
      <rect x={52} y={60} width={50} height={42} rx={3} fill={color.woodDark} {...LINE} />
      {[70, 78, 86, 94].map((y) => (
        <path key={y} d={`M56 ${y}h42`} stroke={INK} strokeWidth={2} opacity={0.5} />
      ))}
    </g>
  );
}

function Shop({ roof }: { roof: string }) {
  const stripes = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g>
      <rect x={16} y={40} width={96} height={62} rx={6} fill={color.paper} {...LINE} />
      <rect x={30} y={18} width={68} height={22} rx={8} fill={roof} {...LINE} />
      <circle cx={52} cy={29} r={5} fill={color.leaf} />
      <circle cx={64} cy={29} r={5} fill={color.marigold} />
      <circle cx={76} cy={29} r={5} fill="#FFFFFF" />
      <rect x={10} y={44} width={108} height={14} rx={4} fill="#FFFFFF" {...LINE} />
      {stripes.map((i) =>
        i % 2 ? null : (
          <rect key={i} x={14 + i * 14.3} y={46} width={14.3} height={10} fill={roof} />
        ),
      )}
      <rect x={10} y={44} width={108} height={14} rx={4} fill="none" {...LINE} />
      <rect x={22} y={64} width={50} height={32} rx={4} fill={color.sky} {...LINE} />
      <circle cx={34} cy={88} r={5} fill={color.tomato} />
      <circle cx={46} cy={88} r={5} fill={color.marigold} />
      <circle cx={58} cy={88} r={5} fill={color.leaf} />
      <Door x={82} y={68} h={34} fill={color.teal} />
    </g>
  );
}

function Airport({ roof }: { roof: string }) {
  return (
    <g>
      <rect x={86} y={34} width={14} height={68} fill={color.paper} {...LINE} />
      <path d="M93 8v10" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={93} cy={7} r={4} fill={color.tomato} {...LINE} strokeWidth={2} />
      <rect x={77} y={18} width={32} height={20} rx={6} fill={roof} {...LINE} />
      <rect x={82} y={23} width={22} height={8} rx={3} fill={color.sky} />
      <rect x={6} y={58} width={76} height={44} rx={6} fill={color.paper} {...LINE} />
      <path d="M0 62Q42 36 86 62Z" fill={roof} {...LINE} />
      <rect
        x={14}
        y={68}
        width={60}
        height={14}
        rx={4}
        fill={color.sky}
        {...LINE}
        strokeWidth={3}
      />
      <path d="M29 68v14M44 68v14M59 68v14" stroke={INK} strokeWidth={2} />
      <rect
        x={34}
        y={86}
        width={20}
        height={16}
        rx={3}
        fill={color.sky}
        {...LINE}
        strokeWidth={3}
      />
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
    ) : b.kind === 'hospital' ? (
      <Hospital roof={b.roofColor} />
    ) : b.kind === 'workshop' ? (
      <Workshop roof={b.roofColor} />
    ) : b.kind === 'shop' ? (
      <Shop roof={b.roofColor} />
    ) : b.kind === 'airport' ? (
      <Airport roof={b.roofColor} />
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
