// Furniture as flat shapes, transcribed from design-reference/Room.dc.html.
// Coordinates are local to the piece (origin = top-left of its box), in room units.
import type { IconName } from '../design/icons';
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
  armchair: {
    id: 'armchair',
    label: 'Armchair',
    layer: 'stand',
    w: 150,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'rect', x: 12, y: 0, w: 126, h: 70, r: [24, 24, 6, 6], fill: '#C8456B' },
      { kind: 'rect', x: 0, y: 40, w: 30, h: 66, r: 14, fill: color.heart },
      { kind: 'rect', x: 120, y: 40, w: 30, h: 66, r: 14, fill: color.heart },
      { kind: 'rect', x: 22, y: 56, w: 106, h: 40, r: 12, fill: color.blossom },
      { kind: 'rect', x: 18, y: 100, w: 10, h: 20, fill: INK },
      { kind: 'rect', x: 122, y: 100, w: 10, h: 20, fill: INK },
      { kind: 'rect', x: 0, y: 92, w: 150, h: 14, r: 7, fill: INK, alpha: 0.12 },
    ],
  },
  chair: {
    id: 'chair',
    label: 'Chair',
    layer: 'stand',
    w: 80,
    h: 130,
    footY: 130,
    shapes: [
      { kind: 'rect', x: 10, y: 0, w: 60, h: 56, r: [12, 12, 4, 4], fill: color.wood },
      { kind: 'rect', x: 4, y: 56, w: 72, h: 16, r: 8, fill: color.woodDark },
      { kind: 'rect', x: 10, y: 72, w: 8, h: 58, fill: color.woodDeep },
      { kind: 'rect', x: 62, y: 72, w: 8, h: 58, fill: color.woodDeep },
    ],
  },
  beanbag: {
    id: 'beanbag',
    label: 'Beanbag',
    layer: 'stand',
    w: 120,
    h: 90,
    footY: 90,
    shapes: [
      { kind: 'ellipse', x: 10, y: 70, w: 100, h: 20, fill: INK, alpha: 0.12 },
      { kind: 'ellipse', x: 0, y: 22, w: 120, h: 66, fill: color.purple },
      { kind: 'ellipse', x: 22, y: 0, w: 76, h: 60, fill: '#A85BC0' },
    ],
  },
  stool: {
    id: 'stool',
    label: 'Stool',
    layer: 'stand',
    w: 70,
    h: 80,
    footY: 80,
    shapes: [
      { kind: 'rect', x: 8, y: 18, w: 8, h: 62, fill: INK },
      { kind: 'rect', x: 54, y: 18, w: 8, h: 62, fill: INK },
      { kind: 'rect', x: 0, y: 0, w: 70, h: 18, r: 9, fill: color.tomato },
    ],
  },
  desk: {
    id: 'desk',
    label: 'Desk',
    layer: 'stand',
    w: 200,
    h: 110,
    footY: 110,
    shapes: [
      { kind: 'rect', x: 6, y: 18, w: 12, h: 92, fill: color.woodDeep },
      {
        kind: 'rect',
        x: 130,
        y: 18,
        w: 66,
        h: 92,
        r: [0, 0, 8, 8],
        fill: color.wood,
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 140, y: 44, w: 46, h: 6, r: 3, fill: color.woodDeep },
      { kind: 'rect', x: 140, y: 76, w: 46, h: 6, r: 3, fill: color.woodDeep },
      { kind: 'rect', x: 0, y: 0, w: 200, h: 18, r: 6, fill: color.woodDark },
    ],
  },
  sideTable: {
    id: 'sideTable',
    label: 'Little table',
    layer: 'stand',
    w: 90,
    h: 80,
    footY: 80,
    shapes: [
      { kind: 'rect', x: 40, y: 14, w: 10, h: 60, fill: INK },
      { kind: 'rect', x: 22, y: 72, w: 46, h: 8, r: 4, fill: INK },
      { kind: 'rect', x: 0, y: 0, w: 90, h: 14, r: 7, fill: color.tealDark },
    ],
  },
  fridge: {
    id: 'fridge',
    label: 'Fridge',
    layer: 'stand',
    w: 110,
    h: 210,
    footY: 210,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 110, h: 210, r: 16, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'rect', x: 6, y: 70, w: 98, h: 6, fill: INK },
      { kind: 'rect', x: 84, y: 28, w: 8, h: 30, r: 4, fill: INK },
      { kind: 'rect', x: 84, y: 96, w: 8, h: 50, r: 4, fill: INK },
      { kind: 'ellipse', x: 20, y: 20, w: 16, h: 16, fill: color.tomato },
      { kind: 'ellipse', x: 40, y: 110, w: 14, h: 14, fill: color.marigold },
    ],
  },
  sink: {
    id: 'sink',
    label: 'Sink',
    layer: 'stand',
    w: 140,
    h: 130,
    footY: 130,
    shapes: [
      { kind: 'rect', x: 0, y: 40, w: 140, h: 90, r: [0, 0, 12, 12], fill: color.cornflower },
      { kind: 'rect', x: 68, y: 54, w: 4, h: 66, r: 2, fill: INK, alpha: 0.2 },
      { kind: 'rect', x: 0, y: 30, w: 140, h: 16, r: 8, fill: '#E8ECF5' },
      { kind: 'rect', x: 30, y: 30, w: 80, h: 10, r: 5, fill: '#9AA3B5' },
      { kind: 'rect', x: 64, y: 0, w: 12, h: 32, r: 6, fill: '#9AA3B5' },
      { kind: 'rect', x: 64, y: 0, w: 30, h: 10, r: 5, fill: '#9AA3B5' },
    ],
  },
  bunkBed: {
    id: 'bunkBed',
    label: 'Bunk bed',
    layer: 'stand',
    w: 200,
    h: 220,
    footY: 220,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 18, h: 220, fill: color.woodDark },
      { kind: 'rect', x: 182, y: 0, w: 18, h: 220, fill: color.woodDark },
      {
        kind: 'rect',
        x: 10,
        y: 40,
        w: 180,
        h: 34,
        r: 10,
        fill: '#FFFFFF',
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 70, y: 40, w: 120, h: 34, r: [0, 10, 10, 0], fill: color.tomato },
      {
        kind: 'rect',
        x: 10,
        y: 150,
        w: 180,
        h: 34,
        r: 10,
        fill: '#FFFFFF',
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 70, y: 150, w: 120, h: 34, r: [0, 10, 10, 0], fill: color.teal },
      { kind: 'rect', x: 150, y: 74, w: 8, h: 76, fill: color.woodDeep },
      { kind: 'rect', x: 140, y: 96, w: 26, h: 5, r: 2, fill: color.woodDeep },
      { kind: 'rect', x: 140, y: 122, w: 26, h: 5, r: 2, fill: color.woodDeep },
    ],
  },
  cot: {
    id: 'cot',
    label: 'Baby bed',
    layer: 'stand',
    w: 140,
    h: 110,
    footY: 110,
    shapes: [
      { kind: 'rect', x: 0, y: 10, w: 14, h: 100, r: [7, 7, 0, 0], fill: color.blossom },
      { kind: 'rect', x: 126, y: 10, w: 14, h: 100, r: [7, 7, 0, 0], fill: color.blossom },
      { kind: 'rect', x: 0, y: 20, w: 140, h: 10, r: 5, fill: color.blossom },
      { kind: 'rect', x: 0, y: 84, w: 140, h: 12, r: 6, fill: color.blossom },
      { kind: 'rect', x: 24, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
      { kind: 'rect', x: 42, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
      { kind: 'rect', x: 60, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
      { kind: 'rect', x: 78, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
      { kind: 'rect', x: 96, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
      { kind: 'rect', x: 114, y: 30, w: 6, h: 54, r: 3, fill: color.blossom },
    ],
  },
  wardrobe: {
    id: 'wardrobe',
    label: 'Wardrobe',
    layer: 'wall',
    w: 150,
    h: 220,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 150, h: 220, r: 12, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 72, y: 10, w: 6, h: 200, r: 3, fill: INK, alpha: 0.35 },
      { kind: 'ellipse', x: 58, y: 100, w: 10, h: 10, fill: color.marigold },
      { kind: 'ellipse', x: 82, y: 100, w: 10, h: 10, fill: color.marigold },
      { kind: 'rect', x: 6, y: 6, w: 138, h: 16, r: [8, 8, 0, 0], fill: color.woodDeep },
    ],
  },
  drawers: {
    id: 'drawers',
    label: 'Chest of drawers',
    layer: 'stand',
    w: 130,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 130, h: 120, r: 12, fill: color.teal, stroke: OUTLINE },
      { kind: 'rect', x: 8, y: 38, w: 114, h: 6, r: 3, fill: INK, alpha: 0.3 },
      { kind: 'rect', x: 8, y: 78, w: 114, h: 6, r: 3, fill: INK, alpha: 0.3 },
      { kind: 'ellipse', x: 58, y: 16, w: 14, h: 10, fill: color.marigold },
      { kind: 'ellipse', x: 58, y: 56, w: 14, h: 10, fill: color.marigold },
      { kind: 'ellipse', x: 58, y: 96, w: 14, h: 10, fill: color.marigold },
    ],
  },
  bathtub: {
    id: 'bathtub',
    label: 'Bath',
    layer: 'stand',
    w: 220,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'ellipse', x: 20, y: 96, w: 22, h: 22, fill: color.marigold },
      { kind: 'ellipse', x: 178, y: 96, w: 22, h: 22, fill: color.marigold },
      {
        kind: 'rect',
        x: 0,
        y: 20,
        w: 220,
        h: 80,
        r: [10, 10, 40, 40],
        fill: '#FFFFFF',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 14, y: 26, w: 192, h: 14, r: 7, fill: color.water },
      { kind: 'ellipse', x: 150, y: 4, w: 26, h: 26, fill: '#E6F6FF' },
      { kind: 'ellipse', x: 172, y: 12, w: 16, h: 16, fill: '#E6F6FF' },
    ],
  },
  tv: {
    id: 'tv',
    label: 'TV',
    layer: 'stand',
    w: 170,
    h: 150,
    footY: 150,
    shapes: [
      { kind: 'rect', x: 76, y: 104, w: 18, h: 28, fill: INK },
      { kind: 'rect', x: 46, y: 132, w: 78, h: 18, r: 9, fill: INK },
      { kind: 'rect', x: 0, y: 0, w: 170, h: 104, r: 14, fill: INK },
      { kind: 'rect', x: 10, y: 10, w: 150, h: 84, r: 8, fill: color.sky },
      { kind: 'ellipse', x: 24, y: 22, w: 40, h: 24, fill: '#FFFFFF', alpha: 0.6 },
    ],
  },
  fireplace: {
    id: 'fireplace',
    label: 'Fireplace',
    layer: 'wall',
    w: 200,
    h: 170,
    shapes: [
      {
        kind: 'rect',
        x: 0,
        y: 20,
        w: 200,
        h: 150,
        r: [8, 8, 0, 0],
        fill: '#C9B2A4',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 50, y: 70, w: 100, h: 100, r: [50, 50, 0, 0], fill: INK },
      { kind: 'ellipse', x: 76, y: 120, w: 48, h: 50, fill: color.tomato },
      { kind: 'ellipse', x: 86, y: 136, w: 28, h: 34, fill: color.marigold },
      { kind: 'rect', x: 0, y: 0, w: 200, h: 24, r: 8, fill: color.woodDark },
    ],
  },
  dollhouse: {
    id: 'dollhouse',
    label: "Doll's house",
    layer: 'stand',
    w: 140,
    h: 140,
    footY: 140,
    shapes: [
      {
        kind: 'rect',
        x: 10,
        y: 50,
        w: 120,
        h: 90,
        r: 6,
        fill: color.blossom,
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 0, y: 10, w: 140, h: 50, r: [40, 40, 4, 4], fill: color.tomato },
      { kind: 'rect', x: 26, y: 70, w: 30, h: 26, r: 4, fill: color.sky },
      { kind: 'rect', x: 84, y: 70, w: 30, h: 26, r: 4, fill: color.sky },
      { kind: 'rect', x: 58, y: 104, w: 24, h: 36, r: [12, 12, 0, 0], fill: color.woodDark },
    ],
  },
  rockingHorse: {
    id: 'rockingHorse',
    label: 'Rocking horse',
    layer: 'stand',
    w: 150,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'ellipse', x: 0, y: 98, w: 150, h: 22, fill: color.woodDark },
      { kind: 'rect', x: 30, y: 70, w: 10, h: 34, fill: color.woodDeep },
      { kind: 'rect', x: 110, y: 70, w: 10, h: 34, fill: color.woodDeep },
      { kind: 'ellipse', x: 8, y: 36, w: 20, h: 30, fill: color.tomato },
      { kind: 'ellipse', x: 20, y: 40, w: 110, h: 44, fill: color.marigold },
      { kind: 'ellipse', x: 96, y: 4, w: 44, h: 40, fill: color.marigold },
      { kind: 'rect', x: 96, y: 4, w: 14, h: 40, r: 7, fill: color.tomato },
      { kind: 'ellipse', x: 122, y: 16, w: 6, h: 6, fill: INK },
    ],
  },
  playTent: {
    id: 'playTent',
    label: 'Play tent',
    layer: 'stand',
    w: 160,
    h: 130,
    footY: 130,
    shapes: [
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 160,
        h: 130,
        r: [80, 80, 0, 0],
        fill: color.marigold,
        stroke: { width: 4, color: INK },
      },
      { kind: 'rect', x: 56, y: 50, w: 48, h: 80, r: [24, 24, 0, 0], fill: color.tomato },
      { kind: 'rect', x: 77, y: 0, w: 6, h: 50, r: 3, fill: color.woodDark },
    ],
  },
  drumKit: {
    id: 'drumKit',
    label: 'Drums',
    layer: 'stand',
    w: 170,
    h: 130,
    footY: 130,
    shapes: [
      { kind: 'rect', x: 143, y: 16, w: 5, h: 114, fill: INK },
      { kind: 'rect', x: 24, y: 78, w: 5, h: 52, fill: INK },
      { kind: 'ellipse', x: 120, y: 10, w: 50, h: 12, fill: color.marigold },
      {
        kind: 'ellipse',
        x: 0,
        y: 40,
        w: 54,
        h: 40,
        fill: color.cornflower,
        stroke: { width: 4, color: INK },
      },
      { kind: 'ellipse', x: 50, y: 50, w: 80, h: 80, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'ellipse', x: 66, y: 66, w: 48, h: 48, fill: color.tomato },
    ],
  },
  flowerPot: {
    id: 'flowerPot',
    label: 'Flowers',
    layer: 'stand',
    w: 80,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'rect', x: 38, y: 22, w: 4, h: 50, fill: color.tree },
      { kind: 'ellipse', x: 44, y: 44, w: 22, h: 12, fill: color.leaf },
      { kind: 'ellipse', x: 20, y: 8, w: 26, h: 26, fill: color.blossom },
      { kind: 'ellipse', x: 42, y: 0, w: 26, h: 26, fill: color.marigold },
      { kind: 'ellipse', x: 30, y: 28, w: 22, h: 22, fill: color.cornflower },
      { kind: 'rect', x: 16, y: 70, w: 48, h: 50, r: [4, 4, 12, 12], fill: color.tomato },
    ],
  },
  cactus: {
    id: 'cactus',
    label: 'Cactus',
    layer: 'stand',
    w: 70,
    h: 120,
    footY: 120,
    shapes: [
      { kind: 'rect', x: 24, y: 20, w: 22, h: 70, r: 11, fill: color.tree },
      { kind: 'rect', x: 6, y: 40, w: 14, h: 34, r: 7, fill: color.tree },
      { kind: 'rect', x: 48, y: 30, w: 14, h: 30, r: 7, fill: color.tree },
      { kind: 'ellipse', x: 28, y: 12, w: 14, h: 14, fill: color.blossom },
      { kind: 'rect', x: 10, y: 84, w: 50, h: 36, r: [4, 4, 10, 10], fill: color.woodDark },
    ],
  },
  bush: {
    id: 'bush',
    label: 'Bush',
    layer: 'stand',
    w: 140,
    h: 90,
    footY: 90,
    shapes: [
      { kind: 'ellipse', x: 0, y: 30, w: 70, h: 60, fill: color.tree },
      { kind: 'ellipse', x: 76, y: 26, w: 64, h: 64, fill: color.tree },
      { kind: 'ellipse', x: 40, y: 0, w: 70, h: 70, fill: color.leaf },
      { kind: 'ellipse', x: 56, y: 20, w: 10, h: 10, fill: color.tomato },
      { kind: 'ellipse', x: 84, y: 40, w: 10, h: 10, fill: color.tomato },
      { kind: 'ellipse', x: 30, y: 52, w: 10, h: 10, fill: color.tomato },
    ],
  },
  picture: {
    id: 'picture',
    label: 'Picture',
    layer: 'wall',
    w: 110,
    h: 90,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 110, h: 90, r: 6, fill: color.woodDark },
      { kind: 'rect', x: 10, y: 10, w: 90, h: 70, r: 4, fill: color.sky },
      { kind: 'ellipse', x: 14, y: 50, w: 60, h: 28, fill: color.leaf },
      { kind: 'ellipse', x: 66, y: 18, w: 20, h: 20, fill: color.marigold },
    ],
  },
  clock: {
    id: 'clock',
    label: 'Clock',
    layer: 'wall',
    w: 80,
    h: 80,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 80, h: 80, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'rect', x: 37, y: 14, w: 6, h: 28, r: 3, fill: INK },
      { kind: 'rect', x: 38, y: 37, w: 22, h: 6, r: 3, fill: INK },
      { kind: 'ellipse', x: 35, y: 35, w: 10, h: 10, fill: color.tomato },
    ],
  },
  mirror: {
    id: 'mirror',
    label: 'Mirror',
    layer: 'wall',
    w: 80,
    h: 130,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 80, h: 130, fill: color.woodDark },
      { kind: 'ellipse', x: 8, y: 8, w: 64, h: 114, fill: '#DDF1FF' },
      { kind: 'rect', x: 22, y: 24, w: 8, h: 40, r: 4, fill: '#FFFFFF', alpha: 0.8 },
    ],
  },
  bunting: {
    id: 'bunting',
    label: 'Party flags',
    layer: 'wall',
    w: 240,
    h: 50,
    shapes: [
      { kind: 'rect', x: 0, y: 6, w: 240, h: 4, r: 2, fill: INK },
      { kind: 'rect', x: 10, y: 8, w: 28, h: 34, r: [0, 0, 14, 14], fill: color.tomato },
      { kind: 'rect', x: 58, y: 8, w: 28, h: 34, r: [0, 0, 14, 14], fill: color.marigold },
      { kind: 'rect', x: 106, y: 8, w: 28, h: 34, r: [0, 0, 14, 14], fill: color.teal },
      { kind: 'rect', x: 154, y: 8, w: 28, h: 34, r: [0, 0, 14, 14], fill: color.blossom },
      { kind: 'rect', x: 202, y: 8, w: 28, h: 34, r: [0, 0, 14, 14], fill: color.cornflower },
    ],
  },
  roundRug: {
    id: 'roundRug',
    label: 'Round rug',
    layer: 'floor',
    w: 200,
    h: 70,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 200, h: 70, fill: color.cornflower },
      { kind: 'ellipse', x: 24, y: 10, w: 152, h: 50, fill: '#7F96FF' },
      { kind: 'ellipse', x: 60, y: 22, w: 80, h: 26, fill: color.cornflower },
    ],
  },
  stripeRug: {
    id: 'stripeRug',
    label: 'Striped rug',
    layer: 'floor',
    w: 220,
    h: 64,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 220, h: 64, r: 10, fill: color.marigold },
      { kind: 'rect', x: 0, y: 12, w: 220, h: 8, fill: color.tomato },
      { kind: 'rect', x: 0, y: 28, w: 220, h: 8, fill: color.teal },
      { kind: 'rect', x: 0, y: 44, w: 220, h: 8, fill: color.tomato },
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

/**
 * Furniture you can put things on (a play-tester asked why everything went on the
 * floor): the local y of the top, where a thing's base sits.
 */
export const surfaceTop: Partial<Record<FurnitureKindId, number>> = {
  table: 9,
  counter: 2,
  cafeTable: 9,
  cakeStand: 40,
  shelf: 40,
  bookshelf: 2,
  desk: 2,
  sideTable: 2,
  drawers: 2,
  fridge: 4,
  fireplace: 4,
};

export interface Surface {
  /** Room x range a thing can stand on. */
  x0: number;
  x1: number;
  /** Room y of the top. */
  top: number;
  /** Room y of the floor in front, where characters stand to use the thing. */
  floorY: number;
}

/** Where things can stand on a piece of furniture, or null if nothing can. */
export function surfaceOf(f: FurnitureInstance): Surface | null {
  const top = surfaceTop[f.kind];
  if (top === undefined) return null;
  const kind: FurnitureKind = furnitureKinds[f.kind];
  const s = f.scale ?? 1;
  const inset = Math.min(30, (kind.w * s) / 4);
  // Standing pieces: their feet. Wall pieces: the floor just in front of the wall.
  const floorY = kind.layer === 'stand' ? f.y + (kind.footY ?? kind.h) * s : 430;
  return { x0: f.x + inset, x1: f.x + kind.w * s - inset, top: f.y + top * s, floorY };
}

/** Pieces the child cannot move or remove (the way in and out of a room). */
export const fixedKinds: FurnitureKindId[] = ['door'];

const ROOM_W = 900;
const WALL_BASE = 362;
const FLOOR_FRONT = 545;

/**
 * Keep a piece where it can stand: wall pieces on the wall, rugs flat on the floor,
 * standing pieces with their feet on the floor. Returns the top-left to use.
 */
export function clampFurniture(f: FurnitureInstance): { x: number; y: number } {
  const kind: FurnitureKind = furnitureKinds[f.kind];
  const s = f.scale ?? 1;
  const w = kind.w * s;
  const h = kind.h * s;
  const x = Math.min(ROOM_W - w - 4, Math.max(4, f.x));
  if (kind.layer === 'wall' && !f.standing) {
    return { x, y: Math.min(WALL_BASE + 8 - h, Math.max(8, f.y)) };
  }
  if (kind.layer === 'floor') {
    return { x, y: Math.min(FLOOR_FRONT + 10 - h, Math.max(WALL_BASE + 4, f.y)) };
  }
  const foot = (kind.footY ?? kind.h) * s;
  const footY = Math.min(FLOOR_FRONT, Math.max(WALL_BASE, f.y + foot));
  return { x, y: footY - foot };
}

export type CatalogueId =
  'sit' | 'eat' | 'sleep' | 'home' | 'play' | 'music' | 'books' | 'plants' | 'walls' | 'floor';

/** The furniture catalogue for decorating, by category (the icon names are from icons.ts). */
export const catalogue: { id: CatalogueId; icon: IconName; kinds: FurnitureKindId[] }[] = [
  { id: 'sit', icon: 'sofa', kinds: ['sofa', 'armchair', 'chair', 'beanbag', 'stool', 'bench'] },
  {
    id: 'eat',
    icon: 'fork',
    kinds: ['table', 'sideTable', 'cafeTable', 'counter', 'stove', 'fridge', 'sink', 'cakeStand'],
  },
  { id: 'sleep', icon: 'bed', kinds: ['bed', 'bunkBed', 'cot'] },
  { id: 'home', icon: 'rooms', kinds: ['wardrobe', 'drawers', 'bathtub', 'fireplace', 'tv'] },
  { id: 'play', icon: 'ball', kinds: ['toyBox', 'dollhouse', 'rockingHorse', 'playTent', 'swing'] },
  { id: 'music', icon: 'note', kinds: ['musicBox', 'piano', 'drumKit', 'stagePlatform'] },
  { id: 'books', icon: 'book', kinds: ['bookshelf', 'desk', 'bookPile'] },
  {
    id: 'plants',
    icon: 'plant',
    kinds: ['plant', 'flowerPot', 'cactus', 'bush', 'tree', 'gardenBed'],
  },
  {
    id: 'walls',
    icon: 'roller',
    kinds: ['window', 'picture', 'clock', 'mirror', 'bunting', 'shelf', 'curtain', 'starLight'],
  },
  { id: 'floor', icon: 'lamp', kinds: ['rug', 'roundRug', 'stripeRug', 'lamp'] },
];

/** Top-left for a piece so it sits where the finger is: feet there, or centred on it. */
export function anchorAt(
  kindId: FurnitureKindId,
  px: number,
  py: number,
  scale = 1,
): { x: number; y: number } {
  const kind: FurnitureKind = furnitureKinds[kindId];
  const w = kind.w * scale;
  const h = kind.h * scale;
  if (kind.layer === 'stand') return { x: px - w / 2, y: py - (kind.footY ?? kind.h) * scale };
  return { x: px - w / 2, y: py - h / 2 };
}
