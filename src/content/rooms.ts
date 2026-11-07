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
        doors: [
          { x: 88, to: 'home-living' },
          { x: 812, to: 'home-play' },
        ],
        furniture: [
          door('door-living', 88),
          door('door-play', 812),
          { id: 'bookshelf-1', kind: 'bookshelf', x: 590, y: 162 },
          { id: 'window-2', kind: 'window', x: 330, y: 52 },
          { id: 'lamp-1', kind: 'lamp', x: 395, y: 250 },
          { id: 'bed-1', kind: 'bed', x: 180, y: 330 },
          { id: 'bed-2', kind: 'bed', x: 470, y: 330 },
          { id: 'toyBox-1', kind: 'toyBox', x: 620, y: 400 },
          { id: 'rug-2', kind: 'rug', x: 300, y: 470 },
        ],
      },
      {
        // A bigger house (a play-tester asked why it had only two rooms).
        id: 'home-play',
        buildingId: 'home',
        wall: roomColor.play,
        stripe: color.leaf,
        floor: color.woodLight,
        indoor: true,
        dividerX: null,
        doors: [
          { x: 88, to: 'home-bedroom' },
          { x: 812, to: 'home-bath' },
        ],
        furniture: [
          door('door-bedroom', 88),
          door('door-bath', 812),
          { id: 'window-1', kind: 'window', x: 330, y: 52 },
          { id: 'picture-1', kind: 'picture', x: 190, y: 70 },
          { id: 'playTent-1', kind: 'playTent', x: 170, y: 330 },
          { id: 'dollhouse-1', kind: 'dollhouse', x: 370, y: 335 },
          { id: 'bunkBed-1', kind: 'bunkBed', x: 540, y: 262 },
          { id: 'roundRug-1', kind: 'roundRug', x: 300, y: 470 },
          { id: 'rockingHorse-1', kind: 'rockingHorse', x: 380, y: 420 },
        ],
      },
      {
        id: 'home-bath',
        buildingId: 'home',
        wall: roomColor.bath,
        stripe: color.cornflower,
        floor: '#9AA3B5',
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'home-play' }],
        furniture: [
          door('door-play', 88),
          { id: 'window-1', kind: 'window', x: 560, y: 52 },
          { id: 'mirror-1', kind: 'mirror', x: 285, y: 110 },
          { id: 'sink-1', kind: 'sink', x: 255, y: 300 },
          { id: 'bathtub-1', kind: 'bathtub', x: 480, y: 340 },
          { id: 'stripeRug-1', kind: 'stripeRug', x: 450, y: 480 },
          { id: 'plant-1', kind: 'plant', x: 780, y: 400 },
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
        doors: [
          { x: 88, to: 'neighbour-main' },
          { x: 812, to: 'neighbour-kitchen' },
        ],
        furniture: [
          door('door-living', 88),
          door('door-kitchen', 812),
          { id: 'window-2', kind: 'window', x: 300, y: 52 },
          { id: 'lamp-1', kind: 'lamp', x: 375, y: 250 },
          { id: 'bed-1', kind: 'bed', x: 160, y: 330 },
          { id: 'bed-2', kind: 'bed', x: 460, y: 330 },
          { id: 'rug-1', kind: 'rug', x: 300, y: 470 },
        ],
      },
      {
        id: 'neighbour-kitchen',
        buildingId: 'neighbour',
        wall: roomColor.kitchen,
        stripe: color.marigold,
        floor: color.wood,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'neighbour-bedroom' }],
        furniture: [
          door('door-bedroom', 88),
          { id: 'shelf-1', kind: 'shelf', x: 190, y: 30 },
          { id: 'window-1', kind: 'window', x: 640, y: 52 },
          { id: 'stove-1', kind: 'stove', x: 190, y: 236 },
          { id: 'fridge-1', kind: 'fridge', x: 490, y: 250 },
          { id: 'sink-1', kind: 'sink', x: 640, y: 330 },
          { id: 'table-1', kind: 'table', x: 280, y: 400 },
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
        doors: [
          { x: 88, to: 'outside' },
          { x: 812, to: 'cafe-terrace' },
        ],
        furniture: [
          door('door-front', 88),
          door('door-terrace', 812),
          { id: 'window-1', kind: 'window', x: 300, y: 40 },
          { id: 'counter-1', kind: 'counter', x: 230, y: 250 },
          { id: 'cafeTable-1', kind: 'cafeTable', x: 470, y: 400 },
          { id: 'cafeTable-2', kind: 'cafeTable', x: 630, y: 420 },
          { id: 'plant-1', kind: 'plant', x: 600, y: 270 },
        ],
      },
      {
        id: 'cafe-terrace',
        buildingId: 'cafe',
        wall: color.sky,
        stripe: null,
        floor: '#E9D2B0',
        indoor: false,
        dividerX: null,
        doors: [{ x: 88, to: 'cafe-main' }],
        furniture: [
          door('door-cafe', 88),
          { id: 'bush-1', kind: 'bush', x: 330, y: 280 },
          { id: 'flowerPot-1', kind: 'flowerPot', x: 190, y: 270 },
          { id: 'flowerPot-2', kind: 'flowerPot', x: 780, y: 270 },
          { id: 'cafeTable-1', kind: 'cafeTable', x: 250, y: 410 },
          { id: 'cafeTable-2', kind: 'cafeTable', x: 520, y: 420 },
          { id: 'cakeStand-1', kind: 'cakeStand', x: 650, y: 300 },
          { id: 'bench-1', kind: 'bench', x: 680, y: 450 },
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
        doors: [
          { x: 70, to: 'outside' },
          { x: 830, to: 'park-pond' },
        ],
        furniture: [
          { id: 'tree-1', kind: 'tree', x: 20, y: 40 },
          { id: 'tree-2', kind: 'tree', x: 690, y: 40 },
          { id: 'swing-1', kind: 'swing', x: 260, y: 200 },
          { id: 'gardenBed-1', kind: 'gardenBed', x: 560, y: 370 },
        ],
      },
      {
        id: 'park-pond',
        buildingId: 'park',
        wall: color.sky,
        stripe: null,
        floor: color.grass,
        indoor: false,
        dividerX: null,
        doors: [{ x: 70, to: 'park-main' }],
        furniture: [
          { id: 'tree-1', kind: 'tree', x: 680, y: 40 },
          { id: 'bush-1', kind: 'bush', x: 200, y: 290 },
          // The pond: a round rug painted water.
          { id: 'pond-1', kind: 'roundRug', x: 300, y: 380, scale: 1.5, paint: color.water },
          { id: 'bench-1', kind: 'bench', x: 110, y: 450 },
          { id: 'flowerPot-1', kind: 'flowerPot', x: 600, y: 300 },
          { id: 'gardenBed-1', kind: 'gardenBed', x: 560, y: 420 },
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
        doors: [
          { x: 88, to: 'outside' },
          { x: 830, to: 'library-kids' },
        ],
        furniture: [
          door('door-front', 88),
          door('door-kids', 830),
          { id: 'bookshelf-1', kind: 'bookshelf', x: 160, y: 162 },
          { id: 'bookshelf-2', kind: 'bookshelf', x: 310, y: 162 },
          { id: 'bookshelf-3', kind: 'bookshelf', x: 460, y: 162 },
          { id: 'bookshelf-4', kind: 'bookshelf', x: 610, y: 162 },
          { id: 'lamp-1', kind: 'lamp', x: 620, y: 360 },
          { id: 'sofa-1', kind: 'sofa', x: 300, y: 380 },
        ],
      },
      {
        id: 'library-kids',
        buildingId: 'library',
        wall: roomColor.play,
        stripe: color.blossom,
        floor: color.woodLight,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'library-main' }],
        furniture: [
          door('door-library', 88),
          { id: 'window-1', kind: 'window', x: 330, y: 52 },
          { id: 'bookshelf-1', kind: 'bookshelf', x: 640, y: 162 },
          { id: 'roundRug-1', kind: 'roundRug', x: 320, y: 470 },
          { id: 'beanbag-1', kind: 'beanbag', x: 200, y: 380 },
          { id: 'beanbag-2', kind: 'beanbag', x: 470, y: 390 },
          { id: 'bookPile-1', kind: 'bookPile', x: 360, y: 420 },
          { id: 'desk-1', kind: 'desk', x: 620, y: 360 },
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
        doors: [
          { x: 88, to: 'outside' },
          { x: 812, to: 'musicHall-practice' },
        ],
        furniture: [
          { id: 'curtain-1', kind: 'curtain', x: 0, y: 0 },
          door('door-front', 88),
          door('door-practice', 812),
          { id: 'stage-1', kind: 'stagePlatform', x: 220, y: 380 },
          { id: 'piano-1', kind: 'piano', x: 380, y: 270 },
          { id: 'musicBox-1', kind: 'musicBox', x: 660, y: 400 },
        ],
      },
      {
        id: 'musicHall-practice',
        buildingId: 'musicHall',
        wall: roomColor.music,
        stripe: color.purple,
        floor: color.wood,
        indoor: true,
        dividerX: null,
        doors: [{ x: 88, to: 'musicHall-main' }],
        furniture: [
          door('door-hall', 88),
          { id: 'picture-1', kind: 'picture', x: 210, y: 80 },
          { id: 'clock-1', kind: 'clock', x: 420, y: 60 },
          { id: 'drumKit-1', kind: 'drumKit', x: 200, y: 330 },
          { id: 'piano-1', kind: 'piano', x: 470, y: 270 },
          { id: 'stool-1', kind: 'stool', x: 410, y: 420 },
          { id: 'starLight-1', kind: 'starLight', x: 760, y: 280 },
        ],
      },
    ],
  },
];

/** Houses the child built, kept in step with the world (see sim/houses.ts). */
let built: BuildingDef[] = [];
/** Rooms the child decorated: their whole furniture list (see sim/houses.ts). */
let edits: Record<string, FurnitureInstance[]> = {};
/** Everything, with the child's decorating applied; rebuilt only when either changes. */
let derived: BuildingDef[] = town;

function rebuild(): void {
  const all = built.length === 0 ? town : [...town, ...built];
  derived = all.map((b) =>
    b.rooms.some((r) => edits[r.id])
      ? {
          ...b,
          rooms: b.rooms.map((r) => (edits[r.id] ? { ...r, furniture: edits[r.id] ?? [] } : r)),
        }
      : b,
  );
}

export function setBuiltBuildings(list: BuildingDef[]): void {
  built = list;
  rebuild();
}

export function setRoomEdits(map: Record<string, FurnitureInstance[]>): void {
  edits = map;
  rebuild();
}

/** The starter town plus everything the child built, as decorated. */
export function allBuildings(): BuildingDef[] {
  return derived;
}

export function findRoom(roomId: string): RoomDef | undefined {
  for (const b of allBuildings()) {
    const r = b.rooms.find((room) => room.id === roomId);
    if (r) return r;
  }
  return undefined;
}

/** A room as designed (or as built in the house wizard), before any decorating. */
export function findBaseRoom(roomId: string): RoomDef | undefined {
  for (const b of built.length === 0 ? town : [...town, ...built]) {
    const r = b.rooms.find((room) => room.id === roomId);
    if (r) return r;
  }
  return undefined;
}

export function findBuilding(buildingId: string): BuildingDef | undefined {
  return allBuildings().find((b) => b.id === buildingId);
}
