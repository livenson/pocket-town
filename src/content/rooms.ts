// The starter town: buildings, their rooms, doors and furniture. Pure data.
// The first room is design-reference/Room.dc.html (kitchen and living room).
import { color, roomColor } from '../design/tokens';
import type { FurnitureInstance } from './furniture';

export type BuildingKind = 'house' | 'cafe' | 'park' | 'library' | 'musicHall';

export interface DoorDef {
  /** Centre of the door on the floor line, in room units. */
  x: number;
  /** Room id behind the door, or the word 'outside' for the front door. */
  to: string;
}

export interface RoomDef {
  id: string;
  buildingId: string;
  wall: string;
  /** Faint vertical stripes on the wallpaper. */
  stripe: string | null;
  floor: string;
  /** Floor planks and skirting (indoor rooms). */
  indoor: boolean;
  /** Optional faint divider where two room areas meet (x in room units). */
  dividerX: number | null;
  doors: DoorDef[];
  furniture: FurnitureInstance[];
}

export interface BuildingDef {
  id: string;
  kind: BuildingKind;
  name: string;
  /** Position on the world map, 0–1 across and down. */
  map: { x: number; y: number };
  roofColor: string;
  rooms: RoomDef[];
}

/** Door pieces are 116 wide; place one centred on a door's x. */
const door = (id: string, x: number): FurnitureInstance => ({
  id,
  kind: 'door',
  x: x - 58,
  y: 150,
});

export const starterRoom: RoomDef = {
  id: 'home-living',
  buildingId: 'home',
  wall: '#FFEFD9',
  stripe: color.tomato,
  floor: color.woodLight,
  indoor: true,
  dividerX: 420,
  doors: [
    { x: 88, to: 'outside' },
    { x: 498, to: 'home-bedroom' },
  ],
  furniture: [
    door('door-front', 88),
    door('door-bedroom', 498),
    { id: 'shelf-1', kind: 'shelf', x: 170, y: 20 },
    { id: 'stove-1', kind: 'stove', x: 160, y: 236 },
    { id: 'window-1', kind: 'window', x: 606, y: 52 },
    { id: 'rug-1', kind: 'rug', x: 600, y: 450 },
    { id: 'sofa-1', kind: 'sofa', x: 606, y: 300 },
    { id: 'table-1', kind: 'table', x: 260, y: 388 },
    { id: 'musicBox-1', kind: 'musicBox', x: 470, y: 400 },
  ],
};

export const town: BuildingDef[] = [
  {
    id: 'home',
    kind: 'house',
    name: 'My house',
    map: { x: 0.24, y: 0.62 },
    roofColor: color.tomato,
    rooms: [
      starterRoom,
      {
        id: 'home-bedroom',
        buildingId: 'home',
        wall: roomColor.bedroom,
        stripe: color.blossom,
        floor: color.woodLight,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'home-living' }],
        furniture: [
          door('door-living', 88),
          { id: 'bookshelf-1', kind: 'bookshelf', x: 190, y: 162 },
          { id: 'window-2', kind: 'window', x: 380, y: 52 },
          { id: 'lamp-1', kind: 'lamp', x: 368, y: 250 },
          { id: 'bed-1', kind: 'bed', x: 460, y: 330 },
          { id: 'bed-2', kind: 'bed', x: 680, y: 330 },
          { id: 'toyBox-1', kind: 'toyBox', x: 220, y: 400 },
          { id: 'rug-2', kind: 'rug', x: 380, y: 470 },
        ],
      },
    ],
  },
  {
    id: 'neighbour',
    kind: 'house',
    name: 'Neighbour house',
    map: { x: 0.12, y: 0.3 },
    roofColor: color.cornflower,
    rooms: [
      {
        id: 'neighbour-main',
        buildingId: 'neighbour',
        wall: roomColor.living,
        stripe: color.teal,
        floor: color.woodLight,
        indoor: true,
        dividerX: 450,
        doors: [
          { x: 88, to: 'outside' },
          { x: 720, to: 'neighbour-bedroom' },
        ],
        furniture: [
          door('door-front', 88),
          door('door-bedroom', 720),
          { id: 'bookshelf-1', kind: 'bookshelf', x: 170, y: 162 },
          { id: 'window-1', kind: 'window', x: 330, y: 52 },
          { id: 'table-1', kind: 'table', x: 300, y: 388 },
          { id: 'sofa-1', kind: 'sofa', x: 470, y: 300 },
          { id: 'toyBox-1', kind: 'toyBox', x: 170, y: 410 },
          { id: 'plant-1', kind: 'plant', x: 830, y: 420 },
        ],
      },
      {
        // Beds belong in a bedroom (a play-tester asked why the living room had one).
        id: 'neighbour-bedroom',
        buildingId: 'neighbour',
        wall: roomColor.bedroom,
        stripe: color.cornflower,
        floor: color.woodLight,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'neighbour-main' }],
        furniture: [
          door('door-living', 88),
          { id: 'window-2', kind: 'window', x: 300, y: 52 },
          { id: 'lamp-1', kind: 'lamp', x: 368, y: 250 },
          { id: 'bed-1', kind: 'bed', x: 460, y: 330 },
          { id: 'bed-2', kind: 'bed', x: 680, y: 330 },
          { id: 'rug-1', kind: 'rug', x: 400, y: 470 },
        ],
      },
    ],
  },
  {
    id: 'cafe',
    kind: 'cafe',
    name: 'Café',
    map: { x: 0.52, y: 0.28 },
    roofColor: color.blossom,
    rooms: [
      {
        id: 'cafe-main',
        buildingId: 'cafe',
        wall: roomColor.kitchen,
        stripe: color.tomato,
        floor: '#C9A385',
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'outside' }],
        furniture: [
          door('door-front', 88),
          { id: 'window-1', kind: 'window', x: 640, y: 52 },
          { id: 'counter-1', kind: 'counter', x: 230, y: 250 },
          { id: 'cafeTable-1', kind: 'cafeTable', x: 610, y: 400 },
          { id: 'cafeTable-2', kind: 'cafeTable', x: 760, y: 420 },
          { id: 'plant-1', kind: 'plant', x: 560, y: 260 },
        ],
      },
    ],
  },
  {
    id: 'park',
    kind: 'park',
    name: 'Park',
    map: { x: 0.8, y: 0.6 },
    roofColor: color.leaf,
    rooms: [
      {
        id: 'park-main',
        buildingId: 'park',
        wall: color.sky,
        stripe: null,
        floor: color.grass,
        indoor: false,
        dividerX: null,
        doors: [{ x: 70, to: 'outside' }],
        furniture: [
          { id: 'tree-1', kind: 'tree', x: 20, y: 40 },
          { id: 'tree-2', kind: 'tree', x: 690, y: 40 },
          { id: 'swing-1', kind: 'swing', x: 260, y: 200 },
          { id: 'gardenBed-1', kind: 'gardenBed', x: 560, y: 370 },
        ],
      },
    ],
  },
  {
    id: 'library',
    kind: 'library',
    name: 'Library',
    map: { x: 0.82, y: 0.24 },
    roofColor: color.teal,
    rooms: [
      {
        id: 'library-main',
        buildingId: 'library',
        wall: roomColor.bath,
        stripe: color.cornflower,
        floor: color.woodLight,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'outside' }],
        furniture: [
          door('door-front', 88),
          { id: 'bookshelf-1', kind: 'bookshelf', x: 200, y: 162 },
          { id: 'bookshelf-2', kind: 'bookshelf', x: 370, y: 162 },
          { id: 'bookshelf-3', kind: 'bookshelf', x: 540, y: 162 },
          { id: 'bookshelf-4', kind: 'bookshelf', x: 710, y: 162 },
          { id: 'lamp-1', kind: 'lamp', x: 620, y: 360 },
          { id: 'sofa-1', kind: 'sofa', x: 300, y: 380 },
        ],
      },
    ],
  },
  {
    id: 'musicHall',
    kind: 'musicHall',
    name: 'Music hall',
    map: { x: 0.5, y: 0.75 },
    roofColor: color.purple,
    rooms: [
      {
        id: 'musicHall-main',
        buildingId: 'musicHall',
        wall: roomColor.music,
        stripe: color.purple,
        floor: color.woodDark,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'outside' }],
        furniture: [
          { id: 'curtain-1', kind: 'curtain', x: 0, y: 0 },
          door('door-front', 88),
          { id: 'stage-1', kind: 'stagePlatform', x: 220, y: 380 },
          { id: 'piano-1', kind: 'piano', x: 380, y: 270 },
          { id: 'musicBox-1', kind: 'musicBox', x: 660, y: 400 },
        ],
      },
    ],
  },
];

/** Houses the child built, kept in step with the world (see sim/houses.ts). */
let built: BuildingDef[] = [];

export function setBuiltBuildings(list: BuildingDef[]): void {
  built = list;
}

/** The starter town plus everything the child built. */
export function allBuildings(): BuildingDef[] {
  return built.length === 0 ? town : [...town, ...built];
}

export function findRoom(roomId: string): RoomDef | undefined {
  for (const b of allBuildings()) {
    const r = b.rooms.find((room) => room.id === roomId);
    if (r) return r;
  }
  return undefined;
}

export function findBuilding(buildingId: string): BuildingDef | undefined {
  return allBuildings().find((b) => b.id === buildingId);
}
