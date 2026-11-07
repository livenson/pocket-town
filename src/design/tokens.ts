// Pocket Town design tokens. Source of truth: docs/DESIGN.md and the design canvas.

export const color = {
  ink: '#2A1640',
  ground: '#FFE6CF',
  paper: '#FFF8F0',
  mutedText: '#5E3F62',

  tomato: '#EF4B2F',
  tomatoShadow: '#B8321C',
  tomatoText: '#C7341B',

  marigold: '#FFB627',
  marigoldShadow: '#C98800',

  teal: '#0FA394',
  tealDark: '#0B7A6F',
  tealShadow: '#075249',

  cornflower: '#4F6BF0',
  cornflowerShadow: '#2F45B5',

  blossom: '#FF8FB1',
  heart: '#D9416A',
  leaf: '#7BC74D',
  grass: '#9AD46F',
  tree: '#4E9A2E',
  sky: '#BFE3FF',
  water: '#7CC8F0',
  night: '#3B2A63',
  purple: '#8E3CA8',
  path: '#F3DDB5',
  peach: '#FFD2AE',

  woodLight: '#F3C99B',
  wood: '#E0A46B',
  woodDark: '#B9774A',
  woodDeep: '#8B5A35',

  invalid: '#C7341B',
  valid: '#0B7A6F',
} as const;

export const roomColor = {
  kitchen: '#FFE08A',
  living: '#BFE6DC',
  bedroom: '#FAD0DC',
  bath: '#CDD6FF',
  music: '#E6CCF0',
  play: '#D9F0C4',
} as const;

export const skinTones = ['#F6D2B4', '#EDC09A', '#E9B48A', '#D49C6C', '#C98E62', '#A86E46', '#8D5A3B', '#5A3725'] as const;
export const hairColors = ['#2A1640', '#5A2E1A', '#C2552B', '#FFB627', '#FF8FB1'] as const;
export const outfitColors = ['#EF4B2F', '#FFB627', '#0FA394', '#4F6BF0', '#FF8FB1', '#7BC74D', '#8E3CA8'] as const;
export const wallColors = ['#FFF8F0', '#FFE08A', '#BFE6DC', '#FAD0DC', '#CDD6FF', '#E6CCF0', '#FFD2AE', '#D9F0C4'] as const;
export const floorColors = ['#E0A46B', '#B9774A', '#F3C99B', '#C9A385', '#9AA3B5', '#FFB627', '#7BC74D', '#EF4B2F'] as const;

export const font = {
  display: "'Baloo 2', system-ui, sans-serif", // weights 600–800
  body: "Nunito, system-ui, sans-serif", // weights 600–900
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const size = {
  touchMin: 44, // absolute minimum for anything interactive
  iconButtonPhone: 56,
  iconButtonTablet: 64,
  primaryTablet: 76, // ~2 cm on most tablets
  pressShadow: 5, // px of bottom shadow on pressable controls
  selectedRing: 4,
} as const;

export const motion = {
  press: 100, // ms
  screen: 250,
  holdToConfirm: 700,
  longPressVoice: 450,
  hoverVoice: 600,
  ease: 'cubic-bezier(.2,.8,.2,1)',
} as const;

export const breakpoints = {
  phoneMaxWidth: 600, // below this, portrait phone layout with "+" sheet
  desktopMinWidth: 1024, // plus (pointer: fine) → desktop affordances
} as const;

export const stage = {
  roomWidth: 900, // logical units, see design-reference/Room.dc.html
  roomHeight: 560,
  floorY: 362, // top of the floor band in logical units
} as const;
