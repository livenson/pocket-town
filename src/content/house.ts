// Houses the child builds in the house wizard (C2), and how one becomes a building
// the simulation can use. Pure data and functions.
import { color, floorColors, roomColor, wallColors } from '../design/tokens';
import type { IconName } from '../design/icons';
import { furnitureKinds, type FurnitureInstance, type FurnitureKindId } from './furniture';
import type { BuildingDef, RoomDef } from './rooms';

export type RoomType = 'kitchen' | 'living' | 'bed' | 'bath' | 'music' | 'play';
export type Shell = 'cottage' | 'tall' | 'dome';
export type HouseItem =
  | 'sofa'
  | 'bed'
  | 'bench'
  | 'lamp'
  | 'plant'
  | 'star'
  | 'ball'
  | 'book'
  | 'note'
  | 'table'
  | 'cake'
  | 'stove';
export type ItemCategory = 'seat' | 'light' | 'fun' | 'kitchen';

export interface PlacedItem {
  /** Room space 0–3. */
  room: number;
  /** Grid cell 0–11: six across, back row 0–5, front row 6–11. */
  cell: number;
  item: HouseItem;
  flip: boolean;
}

export interface HouseDef {
  id: string;
  /** Plot on the neighbourhood map, 0–3. */
  plot: number;
  shell: Shell;
  mode: 'play' | 'decorate' | null;
  rooms: [RoomType | null, RoomType | null, RoomType | null, RoomType | null];
  walls: [string, string, string, string];
  floors: [string, string, string, string];
  items: PlacedItem[];
  /** Number shown on the map and in the hub ("House 2"). */
  number: number;
  warmed: boolean;
}

export const ROOM_TYPES: Record<RoomType, { icon: IconName; color: string }> = {
  kitchen: { icon: 'fork', color: roomColor.kitchen },
  living: { icon: 'sofa', color: roomColor.living },
  bed: { icon: 'bed', color: roomColor.bedroom },
  bath: { icon: 'sparkle', color: roomColor.bath },
  music: { icon: 'note', color: roomColor.music },
  play: { icon: 'ball', color: roomColor.play },
};

export const ITEMS: Record<
  HouseItem,
  { icon: IconName; tint: string; ink: string; category: ItemCategory; kind: FurnitureKindId }
> = {
  sofa: { icon: 'sofa', tint: color.teal, ink: '#FFFFFF', category: 'seat', kind: 'sofa' },
  bed: { icon: 'bed', tint: roomColor.bedroom, ink: color.ink, category: 'seat', kind: 'bed' },
  bench: { icon: 'minus', tint: color.cornflower, ink: '#FFFFFF', category: 'seat', kind: 'bench' },
  lamp: { icon: 'lamp', tint: color.marigold, ink: color.ink, category: 'light', kind: 'lamp' },
  plant: { icon: 'plant', tint: color.leaf, ink: color.ink, category: 'light', kind: 'plant' },
  star: { icon: 'star', tint: '#FFE08A', ink: color.ink, category: 'light', kind: 'starLight' },
  ball: { icon: 'ball', tint: roomColor.living, ink: color.ink, category: 'fun', kind: 'toyBox' },
  book: { icon: 'book', tint: roomColor.bath, ink: color.ink, category: 'fun', kind: 'bookPile' },
  note: { icon: 'note', tint: roomColor.music, ink: color.ink, category: 'fun', kind: 'musicBox' },
  table: { icon: 'rooms', tint: color.wood, ink: color.ink, category: 'kitchen', kind: 'table' },
  cake: { icon: 'cake', tint: color.peach, ink: color.ink, category: 'kitchen', kind: 'cakeStand' },
  stove: { icon: 'grid4', tint: '#FFFFFF', ink: color.ink, category: 'kitchen', kind: 'stove' },
};

export const CATEGORIES: { id: ItemCategory; icon: IconName }[] = [
  { id: 'seat', icon: 'sofa' },
  { id: 'light', icon: 'lamp' },
  { id: 'fun', icon: 'ball' },
  { id: 'kitchen', icon: 'fork' },
];

export const ROOM_KEYS: RoomType[] = ['kitchen', 'living', 'bed', 'bath', 'music', 'play'];
export const ITEM_KEYS: HouseItem[] = [
  'sofa',
  'bed',
  'bench',
  'lamp',
  'plant',
  'star',
  'ball',
  'book',
  'note',
  'table',
  'cake',
  'stove',
];

export const WALLS = wallColors;
export const FLOORS = floorColors;
export const SHELLS: Shell[] = ['cottage', 'tall', 'dome'];
export const ROOF: Record<Shell, string> = {
  cottage: color.tomato,
  tall: color.cornflower,
  dome: color.teal,
};
/** Plot positions on the neighbourhood map (0–1 across and down). */
export const PLOTS: { x: number; y: number }[] = [
  { x: 0.34, y: 0.42 },
  { x: 0.66, y: 0.46 },
  { x: 0.2, y: 0.84 },
  { x: 0.84, y: 0.84 },
];

export const CELLS = 12;
const COLUMNS = 6;
/** Cell centres across the room, clear of the doors at the edges. */
const CELL_X = [205, 303, 401, 499, 597, 695];
/** Where pieces meet the floor: back row by the wall, front row nearer us. */
const ROW_FOOT = [404, 486];
const CELL_WIDTH = 112;

export function emptyHouse(id: string, number: number, plot: number): HouseDef {
  return {
    id,
    plot,
    shell: 'cottage',
    mode: null,
    rooms: [null, null, null, null],
    walls: ['#FFF8F0', '#FFF8F0', '#FFF8F0', '#FFF8F0'],
    floors: [color.wood, color.wood, color.wood, color.wood],
    items: [],
    number,
    warmed: false,
  };
}

/** "Ready to play": painted and furnished, straight to moving in. */
export function readyHouse(base: HouseDef): HouseDef {
  return {
    ...base,
    mode: 'play',
    rooms: ['kitchen', 'living', 'bed', 'bath'],
    walls: [roomColor.kitchen, roomColor.living, roomColor.bedroom, roomColor.bath],
    floors: [color.wood, color.woodLight, color.wood, '#9AA3B5'],
    items: [
      { room: 0, cell: 2, item: 'table', flip: false },
      { room: 0, cell: 0, item: 'stove', flip: false },
      { room: 0, cell: 9, item: 'cake', flip: false },
      { room: 1, cell: 1, item: 'sofa', flip: false },
      { room: 1, cell: 5, item: 'lamp', flip: false },
      { room: 1, cell: 8, item: 'plant', flip: false },
      { room: 1, cell: 10, item: 'note', flip: false },
      { room: 2, cell: 1, item: 'bed', flip: false },
      { room: 2, cell: 3, item: 'bed', flip: true },
      { room: 2, cell: 10, item: 'book', flip: false },
      { room: 3, cell: 3, item: 'plant', flip: false },
      { room: 3, cell: 7, item: 'ball', flip: false },
    ],
  };
}

/** A furniture piece for a grid cell, scaled to fit the cell. */
export function itemInstance(roomId: string, p: PlacedItem, index: number): FurnitureInstance {
  const def = ITEMS[p.item];
  const kind = furnitureKinds[def.kind];
  const scale = Math.min(
    1,
    (CELL_WIDTH * (p.item === 'sofa' || p.item === 'bed' || p.item === 'stove' ? 1.5 : 1.1)) /
      kind.w,
  );
  const col = p.cell % COLUMNS;
  const row = Math.floor(p.cell / COLUMNS);
  const cx = CELL_X[col] ?? 450;
  const foot = ROW_FOOT[row] ?? 450;
  const footY = 'footY' in kind ? kind.footY : kind.h;
  return {
    id: `${roomId}-i${index}`,
    kind: def.kind,
    x: cx - (kind.w * scale) / 2,
    y: foot - footY * scale,
    scale,
    flip: p.flip,
    standing: true,
  };
}

export const roomIdOf = (house: HouseDef, space: number) => `${house.id}-r${space}`;

/** The rooms a house really has (spaces with a room type), in order. */
export function houseRooms(house: HouseDef): number[] {
  return house.rooms.flatMap((t, i) => (t ? [i] : []));
}

/** Turn a house into a building: rooms in a row, joined by doors; the first has the front door. */
export function buildingOf(house: HouseDef, name: string): BuildingDef {
  const spaces = houseRooms(house);
  const rooms: RoomDef[] = spaces.map((space, k) => {
    const id = roomIdOf(house, space);
    const prev = spaces[k - 1];
    const next = spaces[k + 1];
    const doors = [
      { x: 88, to: prev === undefined ? 'outside' : roomIdOf(house, prev) },
      ...(next === undefined ? [] : [{ x: 812, to: roomIdOf(house, next) }]),
    ];
    const type = house.rooms[space];
    return {
      id,
      buildingId: house.id,
      wall: house.walls[space] ?? '#FFF8F0',
      stripe: type ? ROOM_TYPES[type].color : null,
      floor: house.floors[space] ?? color.wood,
      indoor: true,
      dividerX: null,
      doors,
      furniture: [
        ...doors.map((d, i) => ({
          id: `${id}-door${i}`,
          kind: 'door' as const,
          x: d.x - 58,
          y: 150,
        })),
        { id: `${id}-window`, kind: 'window' as const, x: 348, y: 52 },
        ...house.items
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.room === space)
          .map(({ p, i }) => itemInstance(id, p, i)),
      ],
    };
  });
  const plot = PLOTS[house.plot] ?? PLOTS[0] ?? { x: 0.5, y: 0.5 };
  return {
    id: house.id,
    kind: 'house',
    name,
    map: plot,
    roofColor: ROOF[house.shell],
    shape: house.shell,
    rooms,
  };
}
