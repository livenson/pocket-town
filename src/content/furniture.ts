// Furniture as flat shapes, transcribed from design-reference/Room.dc.html.
// Coordinates are local to the piece (origin = top-left of its box), in room units.
import { color } from '../design/tokens';

export type Corner4 = [number, number, number, number];

export interface Stroke {
  width: number;
  color: string;
}

export type Shape =
  | {
      kind: 'rect';
      x: number;
      y: number;
      w: number;
      h: number;
      /** Corner radius, or per corner (tl, tr, br, bl). */
      r?: number | Corner4;
      fill: string;
      alpha?: number;
      stroke?: Stroke;
    }
  | {
      kind: 'ellipse';
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      alpha?: number;
      stroke?: Stroke;
    };

/**
 * wall: hangs on or stands against the wall, always behind characters.
 * floor: lies flat on the floor (rugs), always under characters.
 * stand: stands on the floor and is depth-sorted with characters by `footY`.
 */
export type FurnitureLayer = 'wall' | 'floor' | 'stand';

export interface FurnitureKind {
  id: string;
  label: string;
  layer: FurnitureLayer;
  w: number;
  h: number;
  /** For `stand` pieces: the y (local) where it meets the floor, for depth sorting. */
  footY?: number;
  shapes: Shape[];
}

const INK = color.ink;
const OUTLINE: Stroke = { width: 6, color: INK };

export const furnitureKinds = {
  door: {
    id: 'door',
    label: 'Door',
    layer: 'wall',
    w: 116,
    h: 212,
    shapes: [
      {
        kind: 'rect',
        x: 3,
        y: 3,
        w: 110,
        h: 212,
        r: [55, 55, 0, 0],
        fill: color.woodDark,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 16, y: 120, w: 84, h: 10, r: 5, fill: INK, alpha: 0.12 },
      { kind: 'ellipse', x: 78, y: 102, w: 12, h: 12, fill: color.marigold },
    ],
  },
  shelf: {
    id: 'shelf',
    label: 'Shelf',
    layer: 'wall',
    w: 220,
    h: 54,
    shapes: [
      { kind: 'rect', x: 0, y: 40, w: 220, h: 14, r: 7, fill: color.woodDark },
      { kind: 'rect', x: 16, y: 8, w: 36, h: 32, r: 8, fill: color.tomato },
      { kind: 'rect', x: 62, y: 0, w: 28, h: 40, r: [14, 14, 6, 6], fill: color.teal },
      { kind: 'rect', x: 100, y: 14, w: 44, h: 26, r: 13, fill: color.marigold },
    ],
  },
  stove: {
    id: 'stove',
    label: 'Kitchen counter',
    layer: 'wall',
    w: 262,
    h: 132,
    shapes: [
      { kind: 'rect', x: 26, y: 0, w: 50, h: 16, r: 8, fill: INK },
      { kind: 'rect', x: 98, y: 0, w: 50, h: 16, r: 8, fill: INK },
      { kind: 'rect', x: 3, y: 17, w: 256, h: 112, r: 14, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'rect', x: 16, y: 54, w: 218, h: 6, r: 3, fill: INK },
      { kind: 'rect', x: 6, y: 104, w: 250, h: 22, r: [0, 0, 11, 11], fill: INK, alpha: 0.08 },
    ],
  },
  window: {
    id: 'window',
    label: 'Window',
    layer: 'wall',
    w: 206,
    h: 176,
    shapes: [
      {
        kind: 'rect',
        x: 4,
        y: 4,
        w: 198,
        h: 168,
        r: 22,
        fill: color.sky,
        stroke: { width: 8, color: INK },
      },
      { kind: 'rect', x: 99, y: 0, w: 8, h: 176, fill: INK },
      { kind: 'rect', x: 28, y: 102, w: 60, h: 22, r: 11, fill: '#FFFFFF' },
    ],
  },
  table: {
    id: 'table',
    label: 'Table',
    layer: 'stand',
    w: 190,
    h: 86,
    footY: 86,
    shapes: [
      { kind: 'rect', x: 12, y: 28, w: 10, h: 58, fill: color.woodDeep },
      { kind: 'rect', x: 168, y: 28, w: 10, h: 58, fill: color.woodDeep },
      { kind: 'rect', x: 0, y: 16, w: 190, h: 14, r: 7, fill: color.woodDeep },
      {
        kind: 'rect',
        x: 82,
        y: 2,
        w: 48,
        h: 18,
        r: [0, 0, 18, 18],
        fill: '#FFFFFF',
        stroke: { width: 4, color: INK },
      },
    ],
  },
  musicBox: {
    id: 'musicBox',
    label: 'Music box',
    layer: 'stand',
    w: 70,
    h: 68,
    footY: 68,
    shapes: [
      { kind: 'rect', x: 0, y: 20, w: 70, h: 48, r: 10, fill: INK },
      {
        kind: 'ellipse',
        x: 12,
        y: 2,
        w: 54,
        h: 28,
        fill: color.purple,
        stroke: { width: 4, color: INK },
      },
    ],
  },
  rug: {
    id: 'rug',
    label: 'Rug',
    layer: 'floor',
    w: 280,
    h: 70,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 280, h: 70, fill: color.blossom },
      { kind: 'ellipse', x: 30, y: 10, w: 220, h: 50, fill: '#FFFFFF', alpha: 0.18 },
    ],
  },
  sofa: {
    id: 'sofa',
    label: 'Sofa',
    layer: 'stand',
    w: 278,
    h: 120,
    footY: 80,
    shapes: [
      { kind: 'rect', x: 14, y: 0, w: 250, h: 64, r: [26, 26, 6, 6], fill: '#0A7469' },
      { kind: 'rect', x: 0, y: 50, w: 278, h: 70, r: 22, fill: color.teal },
      { kind: 'rect', x: 0, y: 98, w: 278, h: 22, r: [0, 0, 22, 22], fill: INK, alpha: 0.12 },
    ],
  },
  bed: {
    id: 'bed',
    label: 'Bed',
    layer: 'stand',
    w: 200,
    h: 110,
    footY: 110,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 22, h: 110, r: [11, 11, 0, 0], fill: color.woodDark },
      { kind: 'rect', x: 178, y: 30, w: 22, h: 80, r: [11, 11, 0, 0], fill: color.woodDark },
      {
        kind: 'rect',
        x: 10,
        y: 50,
        w: 180,
        h: 46,
        r: 12,
        fill: '#FFFFFF',
        stroke: { width: 5, color: INK },
      },
      {
        kind: 'rect',
        x: 24,
        y: 40,
        w: 50,
        h: 24,
        r: 12,
        fill: '#FFFFFF',
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 80, y: 52, w: 108, h: 42, r: [6, 10, 10, 6], fill: color.cornflower },
      { kind: 'rect', x: 80, y: 80, w: 108, h: 14, r: [0, 0, 10, 6], fill: INK, alpha: 0.15 },
    ],
  },
  bookshelf: {
    id: 'bookshelf',
    label: 'Bookshelf',
    layer: 'wall',
    w: 150,
    h: 200,
    shapes: [
      { kind: 'rect', x: 3, y: 3, w: 144, h: 197, r: 12, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 14, y: 60, w: 122, h: 8, fill: INK, alpha: 0.35 },
      { kind: 'rect', x: 14, y: 124, w: 122, h: 8, fill: INK, alpha: 0.35 },
      { kind: 'rect', x: 20, y: 22, w: 14, h: 38, r: 3, fill: color.tomato },
      { kind: 'rect', x: 38, y: 28, w: 12, h: 32, r: 3, fill: color.marigold },
      { kind: 'rect', x: 54, y: 20, w: 16, h: 40, r: 3, fill: color.teal },
      { kind: 'rect', x: 92, y: 26, w: 14, h: 34, r: 3, fill: color.cornflower },
      { kind: 'rect', x: 24, y: 86, w: 16, h: 38, r: 3, fill: color.blossom },
      { kind: 'rect', x: 44, y: 90, w: 12, h: 34, r: 3, fill: color.leaf },
      { kind: 'rect', x: 84, y: 84, w: 16, h: 40, r: 3, fill: color.tomato },
      { kind: 'rect', x: 104, y: 92, w: 14, h: 32, r: 3, fill: color.marigold },
      { kind: 'rect', x: 30, y: 150, w: 16, h: 38, r: 3, fill: color.teal },
      { kind: 'rect', x: 70, y: 152, w: 14, h: 36, r: 3, fill: color.purple },
      { kind: 'rect', x: 100, y: 148, w: 16, h: 40, r: 3, fill: color.cornflower },
    ],
  },
  toyBox: {
    id: 'toyBox',
    label: 'Toy box',
    layer: 'stand',
    w: 110,
    h: 90,
    footY: 90,
    shapes: [
      {
        kind: 'ellipse',
        x: 54,
        y: 0,
        w: 44,
        h: 44,
        fill: color.tomato,
        stroke: { width: 4, color: INK },
      },
      {
        kind: 'rect',
        x: 0,
        y: 30,
        w: 110,
        h: 60,
        r: 12,
        fill: color.marigold,
        stroke: { width: 5, color: INK },
      },
      { kind: 'rect', x: 14, y: 50, w: 82, h: 8, r: 4, fill: INK, alpha: 0.2 },
    ],
  },
  counter: {
    id: 'counter',
    label: 'Café counter',
    layer: 'stand',
    w: 320,
    h: 130,
    footY: 112,
    shapes: [
      { kind: 'rect', x: 40, y: 0, w: 46, h: 40, r: [20, 20, 6, 6], fill: color.blossom },
      { kind: 'rect', x: 100, y: 10, w: 40, h: 30, r: 8, fill: color.marigold },
      { kind: 'rect', x: 230, y: 4, w: 50, h: 36, r: [24, 24, 6, 6], fill: color.leaf },
      { kind: 'rect', x: 0, y: 36, w: 320, h: 22, r: 11, fill: color.woodDeep },
      {
        kind: 'rect',
        x: 12,
        y: 56,
        w: 296,
        h: 74,
        r: [0, 0, 16, 16],
        fill: '#FFFFFF',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 12, y: 80, w: 296, h: 12, fill: color.tomato },
    ],
  },
  cafeTable: {
    id: 'cafeTable',
    label: 'Café table',
    layer: 'stand',
    w: 120,
    h: 80,
    footY: 80,
    shapes: [
      { kind: 'rect', x: 55, y: 18, w: 10, h: 56, fill: INK },
      { kind: 'rect', x: 30, y: 72, w: 60, h: 8, r: 4, fill: INK },
      {
        kind: 'ellipse',
        x: 0,
        y: 6,
        w: 120,
        h: 24,
        fill: '#FFFFFF',
        stroke: { width: 5, color: INK },
      },
      { kind: 'rect', x: 46, y: 0, w: 28, h: 14, r: [0, 0, 10, 10], fill: color.cornflower },
    ],
  },
  swing: {
    id: 'swing',
    label: 'Swings',
    layer: 'stand',
    w: 240,
    h: 240,
    footY: 236,
    shapes: [
      {
        kind: 'rect',
        x: 10,
        y: 0,
        w: 220,
        h: 18,
        r: 9,
        fill: color.tomato,
        stroke: { width: 5, color: INK },
      },
      { kind: 'rect', x: 18, y: 10, w: 14, h: 230, r: 7, fill: color.tomato },
      { kind: 'rect', x: 208, y: 10, w: 14, h: 230, r: 7, fill: color.tomato },
      { kind: 'rect', x: 64, y: 18, w: 4, h: 140, fill: INK },
      { kind: 'rect', x: 102, y: 18, w: 4, h: 140, fill: INK },
      { kind: 'rect', x: 134, y: 18, w: 4, h: 140, fill: INK },
      { kind: 'rect', x: 172, y: 18, w: 4, h: 140, fill: INK },
      {
        kind: 'rect',
        x: 56,
        y: 154,
        w: 58,
        h: 12,
        r: 6,
        fill: color.marigold,
        stroke: { width: 3, color: INK },
      },
      {
        kind: 'rect',
        x: 126,
        y: 154,
        w: 58,
        h: 12,
        r: 6,
        fill: color.teal,
        stroke: { width: 3, color: INK },
      },
    ],
  },
  gardenBed: {
    id: 'gardenBed',
    label: 'Garden bed',
    layer: 'stand',
    w: 220,
    h: 90,
    footY: 90,
    shapes: [
      { kind: 'ellipse', x: 20, y: 0, w: 40, h: 40, fill: color.blossom },
      { kind: 'ellipse', x: 90, y: 6, w: 36, h: 36, fill: color.marigold },
      { kind: 'ellipse', x: 156, y: 0, w: 40, h: 40, fill: color.tomato },
      { kind: 'rect', x: 36, y: 30, w: 8, h: 30, fill: color.tree },
      { kind: 'rect', x: 104, y: 34, w: 8, h: 26, fill: color.tree },
      { kind: 'rect', x: 172, y: 30, w: 8, h: 30, fill: color.tree },
      {
        kind: 'rect',
        x: 0,
        y: 52,
        w: 220,
        h: 38,
        r: 14,
        fill: color.woodDark,
        stroke: { width: 5, color: INK },
      },
    ],
  },
  tree: {
    id: 'tree',
    label: 'Tree',
    layer: 'wall',
    w: 200,
    h: 330,
    shapes: [
      { kind: 'rect', x: 84, y: 150, w: 32, h: 180, r: 10, fill: color.woodDark },
      { kind: 'ellipse', x: 0, y: 0, w: 200, h: 190, fill: color.tree },
      { kind: 'ellipse', x: 30, y: 20, w: 90, h: 80, fill: color.leaf },
    ],
  },
  piano: {
    id: 'piano',
    label: 'Piano',
    layer: 'stand',
    w: 220,
    h: 160,
    footY: 160,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 220, h: 120, r: [20, 20, 6, 6], fill: INK },
      { kind: 'rect', x: 14, y: 84, w: 192, h: 26, r: 4, fill: '#FFFFFF' },
      { kind: 'rect', x: 34, y: 84, w: 10, h: 16, fill: INK },
      { kind: 'rect', x: 64, y: 84, w: 10, h: 16, fill: INK },
      { kind: 'rect', x: 110, y: 84, w: 10, h: 16, fill: INK },
      { kind: 'rect', x: 140, y: 84, w: 10, h: 16, fill: INK },
      { kind: 'rect', x: 170, y: 84, w: 10, h: 16, fill: INK },
      { kind: 'rect', x: 14, y: 116, w: 14, h: 44, fill: INK },
      { kind: 'rect', x: 192, y: 116, w: 14, h: 44, fill: INK },
      { kind: 'rect', x: 80, y: 20, w: 60, h: 40, r: 6, fill: '#FFFFFF', alpha: 0.9 },
    ],
  },
  stagePlatform: {
    id: 'stagePlatform',
    label: 'Stage',
    layer: 'floor',
    w: 520,
    h: 70,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 520, h: 70, r: 18, fill: color.purple },
      { kind: 'rect', x: 0, y: 46, w: 520, h: 24, r: [0, 0, 18, 18], fill: INK, alpha: 0.2 },
    ],
  },
  curtain: {
    id: 'curtain',
    label: 'Curtains',
    layer: 'wall',
    w: 900,
    h: 120,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 900, h: 50, fill: color.tomato },
      { kind: 'rect', x: 0, y: 0, w: 120, h: 330, r: [0, 0, 60, 0], fill: color.tomato },
      { kind: 'rect', x: 780, y: 0, w: 120, h: 330, r: [0, 0, 0, 60], fill: color.tomato },
      { kind: 'rect', x: 0, y: 42, w: 900, h: 10, fill: INK, alpha: 0.2 },
    ],
  },
  plant: {
    id: 'plant',
    label: 'Plant',
    layer: 'stand',
    w: 70,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 46, h: 70, fill: color.leaf },
      { kind: 'ellipse', x: 26, y: 14, w: 44, h: 64, fill: color.tree },
      {
        kind: 'rect',
        x: 12,
        y: 70,
        w: 46,
        h: 50,
        r: [6, 6, 16, 16],
        fill: color.tomato,
        stroke: { width: 4, color: INK },
      },
    ],
  },
  lamp: {
    id: 'lamp',
    label: 'Lamp',
    layer: 'stand',
    w: 70,
    h: 190,
    footY: 190,
    shapes: [
      { kind: 'rect', x: 32, y: 50, w: 6, h: 134, fill: INK },
      { kind: 'rect', x: 14, y: 180, w: 42, h: 10, r: 5, fill: INK },
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 70,
        h: 56,
        r: [14, 14, 4, 4],
        fill: color.marigold,
        stroke: { width: 4, color: INK },
      },
    ],
  },
  bench: {
    id: 'bench',
    label: 'Bench',
    layer: 'stand',
    w: 160,
    h: 70,
    footY: 70,
    shapes: [
      { kind: 'rect', x: 10, y: 36, w: 12, h: 34, fill: INK },
      { kind: 'rect', x: 138, y: 36, w: 12, h: 34, fill: INK },
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 160,
        h: 18,
        r: 9,
        fill: color.cornflower,
        stroke: { width: 4, color: INK },
      },
      {
        kind: 'rect',
        x: 0,
        y: 24,
        w: 160,
        h: 18,
        r: 9,
        fill: color.cornflower,
        stroke: { width: 4, color: INK },
      },
    ],
  },
  starLight: {
    id: 'starLight',
    label: 'Star light',
    layer: 'stand',
    w: 80,
    h: 160,
    footY: 160,
    shapes: [
      { kind: 'rect', x: 37, y: 60, w: 6, h: 96, fill: INK },
      { kind: 'rect', x: 20, y: 152, w: 40, h: 8, r: 4, fill: INK },
      {
        kind: 'ellipse',
        x: 4,
        y: 0,
        w: 72,
        h: 72,
        fill: '#FFE08A',
        stroke: { width: 4, color: INK },
      },
      { kind: 'ellipse', x: 26, y: 22, w: 28, h: 28, fill: color.marigold },
    ],
  },
  cakeStand: {
    id: 'cakeStand',
    label: 'Cake stand',
    layer: 'stand',
    w: 110,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'rect', x: 50, y: 64, w: 10, h: 50, fill: INK },
      { kind: 'rect', x: 26, y: 110, w: 58, h: 10, r: 5, fill: INK },
      {
        kind: 'ellipse',
        x: 0,
        y: 56,
        w: 110,
        h: 18,
        fill: '#FFFFFF',
        stroke: { width: 4, color: INK },
      },
      {
        kind: 'rect',
        x: 18,
        y: 18,
        w: 74,
        h: 44,
        r: 10,
        fill: '#FFD2AE',
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 18, y: 30, w: 74, h: 8, fill: color.blossom },
      { kind: 'rect', x: 52, y: 0, w: 6, h: 20, r: 3, fill: color.tomato },
    ],
  },
  bookPile: {
    id: 'bookPile',
    label: 'Books',
    layer: 'stand',
    w: 100,
    h: 90,
    footY: 90,
    shapes: [
      {
        kind: 'rect',
        x: 4,
        y: 62,
        w: 92,
        h: 26,
        r: 6,
        fill: color.cornflower,
        stroke: { width: 4, color: INK },
      },
      {
        kind: 'rect',
        x: 12,
        y: 36,
        w: 78,
        h: 26,
        r: 6,
        fill: color.tomato,
        stroke: { width: 4, color: INK },
      },
      {
        kind: 'rect',
        x: 6,
        y: 10,
        w: 84,
        h: 26,
        r: 6,
        fill: color.marigold,
        stroke: { width: 4, color: INK },
      },
    ],
  },
} as const satisfies Record<string, FurnitureKind>;

export type FurnitureKindId = keyof typeof furnitureKinds;

export interface FurnitureInstance {
  id: string;
  kind: FurnitureKindId;
  /** Top-left of the piece in room units. */
  x: number;
  y: number;
  /** Drawn smaller (house-wizard pieces fit one grid cell). */
  scale?: number;
  /** Turned to face the other way. */
  flip?: boolean;
  /** Stands on the floor in front of the wall, sorted with characters (house pieces). */
  standing?: boolean;
}
