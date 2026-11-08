// Furniture as flat shapes, transcribed from design-reference/Room.dc.html.
// Coordinates are local to the piece (origin = top-left of its box), in room units.
import type { IconName } from '../design/icons';
import { color } from '../design/tokens';
import { townFurniture } from './townFurniture';

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
/** A lighter outline for soft things (cushions). */
const SOFT: Stroke = { width: 5, color: INK };
const LINE4: Stroke = { width: 4, color: INK };
/** Small details (handles, knobs, jars). */
const THIN: Stroke = { width: 3, color: INK };

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
        h: 209,
        r: [55, 55, 0, 0],
        fill: color.woodDark,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 22, y: 40, w: 72, h: 62, r: [30, 30, 6, 6], fill: INK, alpha: 0.1 },
      { kind: 'rect', x: 22, y: 116, w: 72, h: 76, r: 6, fill: INK, alpha: 0.1 },
      { kind: 'rect', x: 14, y: 34, w: 6, h: 160, r: 3, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 80, y: 104, w: 14, h: 14, fill: color.marigold, stroke: THIN },
    ],
  },
  shelf: {
    id: 'shelf',
    label: 'Shelf',
    layer: 'wall',
    w: 220,
    h: 54,
    shapes: [
      { kind: 'rect', x: 18, y: 6, w: 34, h: 34, r: 8, fill: color.tomato, stroke: THIN },
      {
        kind: 'rect',
        x: 62,
        y: 0,
        w: 28,
        h: 40,
        r: [14, 14, 6, 6],
        fill: color.teal,
        stroke: THIN,
      },
      { kind: 'rect', x: 100, y: 12, w: 44, h: 28, r: 13, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 0, y: 38, w: 220, h: 16, r: 8, fill: color.woodDark, stroke: LINE4 },
    ],
  },
  stove: {
    id: 'stove',
    label: 'Kitchen counter',
    layer: 'wall',
    w: 262,
    h: 132,
    shapes: [
      {
        kind: 'rect',
        x: 34,
        y: 0,
        w: 48,
        h: 22,
        r: [6, 6, 10, 10],
        fill: color.tomato,
        stroke: LINE4,
      },
      { kind: 'rect', x: 50, y: -6, w: 16, h: 8, r: 4, fill: INK },
      {
        kind: 'rect',
        x: 108,
        y: 8,
        w: 48,
        h: 14,
        r: [4, 4, 8, 8],
        fill: color.teal,
        stroke: LINE4,
      },
      { kind: 'rect', x: 154, y: 12, w: 26, h: 6, r: 3, fill: INK },
      {
        kind: 'rect',
        x: 4,
        y: 28,
        w: 254,
        h: 102,
        r: [0, 0, 14, 14],
        fill: '#FFFFFF',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 0, y: 16, w: 262, h: 16, r: 8, fill: color.woodDark, stroke: LINE4 },
      { kind: 'rect', x: 20, y: 44, w: 92, h: 70, r: 8, fill: INK, alpha: 0.06 },
      { kind: 'rect', x: 96, y: 66, w: 6, h: 24, r: 3, fill: INK },
      { kind: 'rect', x: 132, y: 42, w: 112, h: 74, r: 10, fill: '#EEF0F6', stroke: LINE4 },
      { kind: 'rect', x: 148, y: 50, w: 80, h: 6, r: 3, fill: INK },
      { kind: 'rect', x: 146, y: 64, w: 84, h: 40, r: 8, fill: color.night },
      { kind: 'rect', x: 156, y: 88, w: 64, h: 8, r: 4, fill: color.marigold, alpha: 0.7 },
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
      {
        kind: 'rect',
        x: 14,
        y: 26,
        w: 12,
        h: 60,
        r: [0, 0, 4, 4],
        fill: color.woodDark,
        stroke: LINE4,
      },
      {
        kind: 'rect',
        x: 164,
        y: 26,
        w: 12,
        h: 60,
        r: [0, 0, 4, 4],
        fill: color.woodDark,
        stroke: LINE4,
      },
      { kind: 'rect', x: 0, y: 12, w: 190, h: 20, r: 9, fill: color.wood, stroke: SOFT },
      { kind: 'rect', x: 10, y: 30, w: 170, h: 6, r: 3, fill: INK, alpha: 0.15 },
      {
        kind: 'rect',
        x: 82,
        y: 0,
        w: 48,
        h: 16,
        r: [0, 0, 16, 16],
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
      { kind: 'rect', x: 4, y: 4, w: 58, h: 14, r: 6, fill: color.purple, stroke: LINE4 },
      { kind: 'rect', x: 9, y: 18, w: 48, h: 14, r: 3, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 2, y: 30, w: 62, h: 34, r: 8, fill: color.purple, stroke: LINE4 },
      { kind: 'rect', x: 8, y: 40, w: 50, h: 5, r: 2.5, fill: '#FFFFFF', alpha: 0.5 },
      { kind: 'ellipse', x: 26, y: 48, w: 14, h: 12, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 60, y: 44, w: 8, h: 5, r: 2, fill: INK },
      { kind: 'ellipse', x: 60, y: 34, w: 10, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 8, y: 62, w: 10, h: 6, r: [0, 0, 3, 3], fill: INK },
      { kind: 'rect', x: 48, y: 62, w: 10, h: 6, r: [0, 0, 3, 3], fill: INK },
    ],
  },
  rug: {
    id: 'rug',
    label: 'Rug',
    layer: 'floor',
    w: 280,
    h: 70,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 280, h: 70, fill: color.blossom, stroke: SOFT },
      { kind: 'ellipse', x: 16, y: 8, w: 248, h: 54, fill: color.heart, alpha: 0.25 },
      { kind: 'ellipse', x: 42, y: 17, w: 196, h: 36, fill: color.blossom },
      { kind: 'ellipse', x: 110, y: 28, w: 60, h: 14, fill: '#FFFFFF', alpha: 0.35 },
    ],
  },
  sofa: {
    id: 'sofa',
    label: 'Sofa',
    layer: 'stand',
    w: 278,
    h: 120,
    footY: 80,
    // Outlined like the other key pieces: back, two seat cushions, arms, legs and a
    // pillow. Body parts share one colour, so painting recolours the whole sofa.
    shapes: [
      { kind: 'rect', x: 34, y: 96, w: 16, h: 24, r: [0, 0, 6, 6], fill: color.woodDeep },
      { kind: 'rect', x: 228, y: 96, w: 16, h: 24, r: [0, 0, 6, 6], fill: color.woodDeep },
      {
        kind: 'rect',
        x: 24,
        y: 0,
        w: 230,
        h: 72,
        r: [30, 30, 8, 8],
        fill: color.teal,
        stroke: SOFT,
      },
      { kind: 'rect', x: 136, y: 14, w: 6, h: 48, r: 3, fill: INK, alpha: 0.18 },
      { kind: 'rect', x: 34, y: 58, w: 210, h: 44, r: 14, fill: color.teal, stroke: SOFT },
      { kind: 'rect', x: 136, y: 62, w: 6, h: 36, r: 3, fill: INK, alpha: 0.22 },
      { kind: 'rect', x: 40, y: 88, w: 198, h: 10, r: 5, fill: INK, alpha: 0.12 },
      { kind: 'rect', x: 0, y: 34, w: 48, h: 72, r: 22, fill: color.teal, stroke: SOFT },
      { kind: 'rect', x: 230, y: 34, w: 48, h: 72, r: 22, fill: color.teal, stroke: SOFT },
      { kind: 'rect', x: 56, y: 22, w: 52, h: 40, r: 16, fill: color.marigold, stroke: SOFT },
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
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 26,
        h: 110,
        r: [13, 13, 3, 3],
        fill: color.woodDark,
        stroke: LINE4,
      },
      { kind: 'rect', x: 12, y: 88, w: 176, h: 12, r: 4, fill: color.woodDark, stroke: LINE4 },
      { kind: 'rect', x: 14, y: 58, w: 60, h: 34, r: 10, fill: '#FFF8F0', stroke: LINE4 },
      {
        kind: 'rect',
        x: 50,
        y: 50,
        w: 140,
        h: 44,
        r: [8, 12, 12, 8],
        fill: color.cornflower,
        stroke: SOFT,
      },
      { kind: 'rect', x: 50, y: 50, w: 140, h: 12, r: [8, 12, 0, 0], fill: '#FFFFFF', alpha: 0.35 },
      { kind: 'rect', x: 56, y: 82, w: 128, h: 8, r: 4, fill: INK, alpha: 0.12 },
      { kind: 'rect', x: 20, y: 38, w: 50, h: 24, r: 12, fill: '#FFFFFF', stroke: LINE4 },
      {
        kind: 'rect',
        x: 174,
        y: 34,
        w: 26,
        h: 76,
        r: [13, 13, 3, 3],
        fill: color.woodDark,
        stroke: LINE4,
      },
    ],
  },
  bookshelf: {
    id: 'bookshelf',
    label: 'Bookshelf',
    layer: 'wall',
    w: 150,
    h: 200,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 150, h: 200, r: 10, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 12, y: 12, w: 126, h: 176, r: 4, fill: color.woodDeep },
      { kind: 'rect', x: 20, y: 30, w: 14, h: 40, r: 3, fill: color.tomato, stroke: THIN },
      { kind: 'rect', x: 36, y: 36, w: 12, h: 34, r: 3, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 50, y: 26, w: 16, h: 44, r: 3, fill: color.teal, stroke: THIN },
      { kind: 'rect', x: 68, y: 34, w: 12, h: 36, r: 3, fill: color.cornflower, stroke: THIN },
      { kind: 'rect', x: 94, y: 56, w: 38, h: 14, r: 3, fill: color.blossom, stroke: THIN },
      { kind: 'rect', x: 98, y: 42, w: 30, h: 14, r: 3, fill: color.leaf, stroke: THIN },
      { kind: 'rect', x: 8, y: 68, w: 134, h: 10, r: 4, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 18, y: 88, w: 14, h: 44, r: 3, fill: color.purple, stroke: THIN },
      { kind: 'rect', x: 34, y: 84, w: 14, h: 48, r: 3, fill: color.leaf, stroke: THIN },
      { kind: 'rect', x: 50, y: 92, w: 12, h: 40, r: 3, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 90, y: 96, w: 36, h: 36, fill: color.sky, stroke: THIN },
      { kind: 'rect', x: 98, y: 104, w: 8, h: 22, r: 3, fill: color.leaf },
      { kind: 'rect', x: 8, y: 130, w: 134, h: 10, r: 4, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 18, y: 150, w: 50, h: 38, r: 6, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 36, y: 146, w: 14, h: 8, r: 3, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 80, y: 146, w: 14, h: 42, r: 3, fill: color.cornflower, stroke: THIN },
      { kind: 'rect', x: 96, y: 152, w: 14, h: 36, r: 3, fill: color.heart, stroke: THIN },
      { kind: 'rect', x: 112, y: 144, w: 14, h: 44, r: 3, fill: color.teal, stroke: THIN },
      { kind: 'rect', x: 8, y: 186, w: 134, h: 6, r: 3, fill: color.woodDark },
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
      { kind: 'ellipse', x: 12, y: 4, w: 42, h: 42, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 14, y: 24, w: 38, h: 5, r: 2, fill: '#FFFFFF', alpha: 0.6 },
      { kind: 'rect', x: 60, y: 12, w: 30, h: 30, r: 6, fill: color.teal, stroke: LINE4 },
      { kind: 'rect', x: 4, y: 34, w: 102, h: 56, r: 10, fill: color.marigold, stroke: OUTLINE },
      { kind: 'rect', x: 0, y: 26, w: 110, h: 18, r: 9, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 30, w: 60, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 44, y: 54, w: 22, h: 22, fill: color.tomato, stroke: THIN },
      { kind: 'rect', x: 12, y: 76, w: 86, h: 8, r: 4, fill: INK, alpha: 0.12 },
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
      {
        kind: 'rect',
        x: 8,
        y: 14,
        w: 304,
        h: 98,
        r: [0, 0, 12, 12],
        fill: '#FFFFFF',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 8, y: 46, w: 304, h: 14, fill: color.tomato },
      { kind: 'rect', x: 8, y: 46, w: 304, h: 4, fill: INK, alpha: 0.12 },
      { kind: 'rect', x: 24, y: 70, w: 82, h: 34, r: 6, fill: INK, alpha: 0.06 },
      { kind: 'rect', x: 119, y: 70, w: 82, h: 34, r: 6, fill: INK, alpha: 0.06 },
      { kind: 'rect', x: 214, y: 70, w: 82, h: 34, r: 6, fill: INK, alpha: 0.06 },
      { kind: 'rect', x: 0, y: 2, w: 320, h: 18, r: 9, fill: color.woodDark, stroke: LINE4 },
      { kind: 'rect', x: 12, y: 6, w: 120, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'rect', x: 30, y: 110, w: 260, h: 6, r: 3, fill: INK, alpha: 0.12 },
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
      { kind: 'rect', x: 54, y: 24, w: 12, h: 48, fill: INK },
      { kind: 'ellipse', x: 28, y: 68, w: 64, h: 12, fill: color.woodDark, stroke: LINE4 },
      { kind: 'ellipse', x: 0, y: 8, w: 120, h: 22, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 8, y: 9, w: 104, h: 12, fill: '#FFFFFF' },
      {
        kind: 'rect',
        x: 48,
        y: 0,
        w: 24,
        h: 14,
        r: [2, 2, 8, 8],
        fill: color.cornflower,
        stroke: THIN,
      },
      { kind: 'ellipse', x: 70, y: 3, w: 8, h: 7, fill: color.cornflower, stroke: THIN },
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
      { kind: 'rect', x: 10, y: 10, w: 14, h: 226, r: 6, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 216, y: 10, w: 14, h: 226, r: 6, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 0, w: 240, h: 20, r: 10, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 4, w: 220, h: 5, r: 2, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'rect', x: 64, y: 20, w: 4, h: 148, fill: INK },
      { kind: 'rect', x: 106, y: 20, w: 4, h: 148, fill: INK },
      { kind: 'rect', x: 132, y: 20, w: 4, h: 148, fill: INK },
      { kind: 'rect', x: 174, y: 20, w: 4, h: 148, fill: INK },
      { kind: 'rect', x: 54, y: 164, w: 64, h: 14, r: 7, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 122, y: 164, w: 64, h: 14, r: 7, fill: color.teal, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 226, w: 36, h: 12, r: 6, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 204, y: 226, w: 36, h: 12, r: 6, fill: color.woodDark, stroke: THIN },
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
      { kind: 'rect', x: 39, y: 26, w: 5, h: 34, fill: color.leaf },
      { kind: 'ellipse', x: 41, y: 34, w: 18, h: 10, fill: color.leaf, stroke: THIN },
      { kind: 'ellipse', x: 26, y: 0, w: 30, h: 30, fill: color.blossom, stroke: LINE4 },
      { kind: 'ellipse', x: 36, y: 10, w: 10, h: 10, fill: color.marigold },
      { kind: 'rect', x: 107, y: 26, w: 5, h: 34, fill: color.leaf },
      { kind: 'ellipse', x: 109, y: 34, w: 18, h: 10, fill: color.leaf, stroke: THIN },
      { kind: 'ellipse', x: 94, y: 0, w: 30, h: 30, fill: color.marigold, stroke: LINE4 },
      { kind: 'ellipse', x: 104, y: 10, w: 10, h: 10, fill: color.tomato },
      { kind: 'rect', x: 173, y: 26, w: 5, h: 34, fill: color.leaf },
      { kind: 'ellipse', x: 175, y: 34, w: 18, h: 10, fill: color.leaf, stroke: THIN },
      { kind: 'ellipse', x: 160, y: 0, w: 30, h: 30, fill: color.tomato, stroke: LINE4 },
      { kind: 'ellipse', x: 170, y: 10, w: 10, h: 10, fill: color.marigold },
      { kind: 'rect', x: 0, y: 46, w: 220, h: 44, r: 10, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 8, y: 44, w: 204, h: 10, r: 5, fill: color.woodDeep },
      { kind: 'rect', x: 8, y: 68, w: 204, h: 4, r: 2, fill: INK, alpha: 0.2 },
      { kind: 'rect', x: 10, y: 58, w: 80, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
    ],
  },
  tree: {
    id: 'tree',
    label: 'Tree',
    layer: 'wall',
    w: 200,
    h: 330,
    shapes: [
      {
        kind: 'rect',
        x: 82,
        y: 150,
        w: 36,
        h: 180,
        r: [8, 8, 0, 0],
        fill: color.woodDark,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 92, y: 170, w: 6, h: 120, r: 3, fill: INK, alpha: 0.12 },
      { kind: 'ellipse', x: 6, y: 34, w: 130, h: 130, fill: INK },
      { kind: 'ellipse', x: 66, y: 0, w: 128, h: 136, fill: INK },
      { kind: 'ellipse', x: 34, y: 78, w: 142, h: 118, fill: INK },
      { kind: 'ellipse', x: 12, y: 40, w: 118, h: 118, fill: color.tree },
      { kind: 'ellipse', x: 72, y: 6, w: 116, h: 124, fill: color.tree },
      { kind: 'ellipse', x: 40, y: 84, w: 130, h: 106, fill: color.tree },
      { kind: 'ellipse', x: 40, y: 54, w: 40, h: 26, fill: '#FFFFFF', alpha: 0.18 },
      { kind: 'ellipse', x: 100, y: 22, w: 40, h: 22, fill: '#FFFFFF', alpha: 0.18 },
      { kind: 'ellipse', x: 60, y: 120, w: 16, h: 16, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 130, y: 80, w: 16, h: 16, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 100, y: 150, w: 16, h: 16, fill: color.tomato, stroke: THIN },
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
      {
        kind: 'rect',
        x: 14,
        y: 112,
        w: 14,
        h: 48,
        r: [0, 0, 4, 4],
        fill: color.woodDeep,
        stroke: LINE4,
      },
      {
        kind: 'rect',
        x: 192,
        y: 112,
        w: 14,
        h: 48,
        r: [0, 0, 4, 4],
        fill: color.woodDeep,
        stroke: LINE4,
      },
      {
        kind: 'rect',
        x: 6,
        y: 6,
        w: 208,
        h: 98,
        r: [14, 14, 4, 4],
        fill: color.woodDeep,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 0, y: 0, w: 220, h: 16, r: 8, fill: color.woodDeep, stroke: LINE4 },
      { kind: 'rect', x: 12, y: 22, w: 6, h: 60, r: 3, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'rect', x: 72, y: 26, w: 76, h: 32, r: 4, fill: '#FFF8F0', stroke: LINE4 },
      { kind: 'rect', x: 82, y: 34, w: 56, h: 3, r: 1, fill: INK, alpha: 0.4 },
      { kind: 'rect', x: 82, y: 42, w: 56, h: 3, r: 1, fill: INK, alpha: 0.4 },
      { kind: 'rect', x: 82, y: 50, w: 40, h: 3, r: 1, fill: INK, alpha: 0.4 },
      { kind: 'rect', x: 0, y: 88, w: 220, h: 28, r: 6, fill: color.woodDeep, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 92, w: 200, h: 18, r: 3, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 28, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'rect', x: 50, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'rect', x: 94, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'rect', x: 116, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'rect', x: 138, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'rect', x: 182, y: 92, w: 10, h: 10, r: [0, 0, 2, 2], fill: INK },
      { kind: 'ellipse', x: 100, y: 148, w: 20, h: 8, fill: color.marigold, stroke: THIN },
    ],
  },
  stagePlatform: {
    id: 'stagePlatform',
    label: 'Stage',
    layer: 'floor',
    w: 520,
    h: 70,
    shapes: [
      {
        kind: 'rect',
        x: 0,
        y: 14,
        w: 520,
        h: 56,
        r: [0, 0, 10, 10],
        fill: color.purple,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 0, y: 0, w: 520, h: 22, r: 8, fill: color.wood, stroke: OUTLINE },
      { kind: 'rect', x: 10, y: 4, w: 200, h: 5, r: 2, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 30, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 110, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 190, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 270, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 350, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 430, y: 36, w: 16, h: 16, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 6, y: 58, w: 508, h: 8, r: 4, fill: INK, alpha: 0.12 },
    ],
  },
  curtain: {
    id: 'curtain',
    label: 'Curtains',
    layer: 'wall',
    w: 900,
    h: 120,
    shapes: [
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 96,
        h: 120,
        r: [0, 0, 44, 0],
        fill: color.tomato,
        stroke: OUTLINE,
      },
      {
        kind: 'rect',
        x: 804,
        y: 0,
        w: 96,
        h: 120,
        r: [0, 0, 0, 44],
        fill: color.tomato,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 30, y: 10, w: 6, h: 96, r: 3, fill: INK, alpha: 0.14 },
      { kind: 'rect', x: 60, y: 10, w: 6, h: 96, r: 3, fill: INK, alpha: 0.14 },
      { kind: 'rect', x: 834, y: 10, w: 6, h: 96, r: 3, fill: INK, alpha: 0.14 },
      { kind: 'rect', x: 864, y: 10, w: 6, h: 96, r: 3, fill: INK, alpha: 0.14 },
      { kind: 'ellipse', x: 70, y: 70, w: 22, h: 22, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 808, y: 70, w: 22, h: 22, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 0, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 60, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 120, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 180, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 240, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 300, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 360, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 420, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 480, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 540, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 600, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 660, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 720, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 780, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'ellipse', x: 840, y: 22, w: 60, h: 34, fill: color.tomato, stroke: SOFT },
      { kind: 'rect', x: 0, y: 0, w: 900, h: 40, fill: color.tomato, stroke: OUTLINE },
      { kind: 'rect', x: 8, y: 6, w: 884, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 26, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 86, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 146, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 206, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 266, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 326, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 386, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 446, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 506, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 566, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 626, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 686, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 746, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 806, y: 30, w: 8, h: 8, fill: color.marigold },
      { kind: 'ellipse', x: 866, y: 30, w: 8, h: 8, fill: color.marigold },
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
      { kind: 'ellipse', x: -4, y: 18, w: 44, h: 38, fill: INK },
      { kind: 'ellipse', x: 30, y: 6, w: 44, h: 40, fill: INK },
      { kind: 'ellipse', x: 8, y: -4, w: 38, h: 40, fill: INK },
      { kind: 'ellipse', x: 16, y: 30, w: 42, h: 40, fill: INK },
      { kind: 'ellipse', x: 0, y: 22, w: 36, h: 30, fill: color.tree },
      { kind: 'ellipse', x: 34, y: 10, w: 36, h: 32, fill: color.tree },
      { kind: 'ellipse', x: 12, y: 0, w: 30, h: 32, fill: color.tree },
      { kind: 'ellipse', x: 20, y: 34, w: 34, h: 32, fill: color.tree },
      { kind: 'ellipse', x: 4, y: 26, w: 26, h: 20, fill: color.leaf },
      { kind: 'ellipse', x: 38, y: 14, w: 26, h: 22, fill: color.leaf },
      { kind: 'ellipse', x: 16, y: 4, w: 22, h: 22, fill: color.leaf },
      { kind: 'ellipse', x: 26, y: 38, w: 24, h: 20, fill: color.leaf },
      { kind: 'rect', x: 34, y: 20, w: 3, h: 46, r: 1.5, fill: INK, alpha: 0.3 },
      {
        kind: 'rect',
        x: 10,
        y: 72,
        w: 50,
        h: 48,
        r: [4, 4, 14, 14],
        fill: color.tomato,
        stroke: LINE4,
      },
      { kind: 'rect', x: 4, y: 66, w: 62, h: 14, r: 7, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 70, w: 30, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 32, y: 44, w: 6, h: 132, fill: INK },
      { kind: 'ellipse', x: 12, y: 174, w: 46, h: 16, fill: color.woodDark, stroke: LINE4 },
      {
        kind: 'rect',
        x: 8,
        y: 0,
        w: 54,
        h: 46,
        r: [12, 12, 4, 4],
        fill: color.marigold,
        stroke: LINE4,
      },
      { kind: 'rect', x: 14, y: 6, w: 8, h: 30, r: 4, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 20, y: 38, w: 30, h: 12, fill: '#FFFFFF', alpha: 0.6 },
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
      { kind: 'rect', x: 16, y: 30, w: 12, h: 40, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 132, y: 30, w: 12, h: 40, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 6, y: 0, w: 148, h: 14, r: 7, fill: color.cornflower, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 18, w: 160, h: 14, r: 7, fill: color.cornflower, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 21, w: 70, h: 3, r: 1.5, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'rect', x: 4, y: 32, w: 152, h: 10, r: 5, fill: color.cornflower, stroke: THIN },
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
      { kind: 'rect', x: 37, y: 58, w: 6, h: 90, fill: INK },
      { kind: 'ellipse', x: 16, y: 146, w: 48, h: 14, fill: color.purple, stroke: LINE4 },
      { kind: 'ellipse', x: 6, y: 0, w: 68, h: 62, fill: '#FFE08A', stroke: LINE4 },
      { kind: 'ellipse', x: 24, y: 16, w: 32, h: 30, fill: color.marigold },
      { kind: 'ellipse', x: 34, y: 25, w: 12, h: 12, fill: '#FFFFFF', alpha: 0.7 },
      { kind: 'ellipse', x: 16, y: 10, w: 8, h: 8, fill: '#FFFFFF', alpha: 0.8 },
      { kind: 'ellipse', x: 58, y: 40, w: 6, h: 6, fill: '#FFFFFF', alpha: 0.8 },
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
      { kind: 'rect', x: 48, y: 52, w: 14, h: 54, r: 4, fill: '#FFFFFF', stroke: LINE4 },
      { kind: 'ellipse', x: 24, y: 102, w: 62, h: 16, fill: '#FFFFFF', stroke: LINE4 },
      { kind: 'rect', x: 20, y: 10, w: 70, h: 32, r: 10, fill: color.peach, stroke: LINE4 },
      { kind: 'rect', x: 18, y: 4, w: 74, h: 16, r: 8, fill: color.blossom, stroke: LINE4 },
      { kind: 'rect', x: 24, y: 26, w: 62, h: 4, r: 2, fill: INK, alpha: 0.15 },
      { kind: 'ellipse', x: 48, y: 0, w: 14, h: 12, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 0, y: 36, w: 110, h: 18, fill: '#FFFFFF', stroke: LINE4 },
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
      { kind: 'rect', x: 0, y: 62, w: 100, h: 26, r: 6, fill: color.cornflower, stroke: LINE4 },
      { kind: 'rect', x: 8, y: 69, w: 88, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.8 },
      { kind: 'rect', x: 0, y: 80, w: 100, h: 3, r: 1, fill: INK, alpha: 0.15 },
      { kind: 'rect', x: 8, y: 36, w: 86, h: 26, r: 6, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 16, y: 43, w: 74, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.8 },
      { kind: 'rect', x: 8, y: 54, w: 86, h: 3, r: 1, fill: INK, alpha: 0.15 },
      { kind: 'rect', x: 2, y: 10, w: 92, h: 26, r: 6, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 10, y: 17, w: 80, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.8 },
      { kind: 'rect', x: 2, y: 28, w: 92, h: 3, r: 1, fill: INK, alpha: 0.15 },
      { kind: 'rect', x: 70, y: 0, w: 8, h: 16, r: [0, 0, 4, 4], fill: color.teal, stroke: THIN },
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
      { kind: 'rect', x: 22, y: 98, w: 12, h: 22, r: [0, 0, 5, 5], fill: color.woodDeep },
      { kind: 'rect', x: 116, y: 98, w: 12, h: 22, r: [0, 0, 5, 5], fill: color.woodDeep },
      {
        kind: 'rect',
        x: 14,
        y: 0,
        w: 122,
        h: 74,
        r: [30, 30, 8, 8],
        fill: color.heart,
        stroke: SOFT,
      },
      { kind: 'rect', x: 32, y: 14, w: 86, h: 40, r: 16, fill: INK, alpha: 0.08 },
      { kind: 'rect', x: 24, y: 60, w: 102, h: 40, r: 12, fill: color.heart, stroke: SOFT },
      { kind: 'rect', x: 30, y: 88, w: 90, h: 8, r: 4, fill: INK, alpha: 0.12 },
      { kind: 'rect', x: 0, y: 38, w: 36, h: 68, r: 17, fill: color.heart, stroke: SOFT },
      { kind: 'rect', x: 114, y: 38, w: 36, h: 68, r: 17, fill: color.heart, stroke: SOFT },
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
      {
        kind: 'rect',
        x: 12,
        y: 68,
        w: 10,
        h: 62,
        r: [0, 0, 4, 4],
        fill: color.woodDark,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 58,
        y: 68,
        w: 10,
        h: 62,
        r: [0, 0, 4, 4],
        fill: color.woodDark,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 10,
        y: 0,
        w: 60,
        h: 58,
        r: [16, 16, 4, 4],
        fill: color.wood,
        stroke: LINE4,
      },
      { kind: 'rect', x: 22, y: 12, w: 36, h: 30, r: 10, fill: INK, alpha: 0.1 },
      { kind: 'rect', x: 2, y: 54, w: 76, h: 18, r: 9, fill: color.wood, stroke: LINE4 },
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
      { kind: 'ellipse', x: 10, y: 72, w: 100, h: 18, fill: INK, alpha: 0.12 },
      { kind: 'ellipse', x: 0, y: 24, w: 120, h: 64, fill: color.purple, stroke: SOFT },
      { kind: 'ellipse', x: 22, y: 0, w: 76, h: 58, fill: color.purple, stroke: SOFT },
      { kind: 'ellipse', x: 38, y: 14, w: 44, h: 22, fill: INK, alpha: 0.12 },
      { kind: 'ellipse', x: 30, y: 6, w: 22, h: 12, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 10, y: 14, w: 9, h: 66, r: [0, 0, 3, 3], fill: INK },
      { kind: 'rect', x: 51, y: 14, w: 9, h: 66, r: [0, 0, 3, 3], fill: INK },
      { kind: 'rect', x: 14, y: 54, w: 42, h: 6, r: 3, fill: INK },
      { kind: 'rect', x: 0, y: 0, w: 70, h: 18, r: 9, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 8, y: 4, w: 30, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
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
      {
        kind: 'rect',
        x: 8,
        y: 16,
        w: 12,
        h: 94,
        r: [0, 0, 4, 4],
        fill: color.woodDark,
        stroke: LINE4,
      },
      {
        kind: 'rect',
        x: 130,
        y: 16,
        w: 66,
        h: 94,
        r: [0, 0, 8, 8],
        fill: color.wood,
        stroke: LINE4,
      },
      { kind: 'rect', x: 136, y: 52, w: 54, h: 4, r: 2, fill: INK, alpha: 0.35 },
      { kind: 'ellipse', x: 156, y: 30, w: 14, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 156, y: 72, w: 14, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 0, y: 0, w: 200, h: 20, r: 7, fill: color.wood, stroke: SOFT },
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
      { kind: 'rect', x: 40, y: 14, w: 10, h: 54, fill: INK },
      { kind: 'ellipse', x: 18, y: 66, w: 54, h: 14, fill: color.teal, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 2, w: 90, h: 16, r: 8, fill: color.teal, stroke: LINE4 },
      { kind: 'rect', x: 8, y: 6, w: 40, h: 3, r: 1.5, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 4, y: 4, w: 102, h: 202, r: 16, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'rect', x: 10, y: 76, w: 90, h: 5, r: 2, fill: INK, alpha: 0.8 },
      { kind: 'rect', x: 84, y: 28, w: 8, h: 36, r: 4, fill: INK },
      { kind: 'rect', x: 84, y: 96, w: 8, h: 52, r: 4, fill: INK },
      { kind: 'ellipse', x: 20, y: 24, w: 14, h: 14, fill: color.tomato, stroke: THIN },
      { kind: 'rect', x: 22, y: 100, w: 24, h: 28, r: 3, fill: '#FFE08A', stroke: THIN },
      { kind: 'rect', x: 26, y: 108, w: 16, h: 3, r: 1, fill: INK, alpha: 0.4 },
      { kind: 'rect', x: 10, y: 184, w: 90, h: 12, r: 6, fill: INK, alpha: 0.06 },
      { kind: 'rect', x: 14, y: 14, w: 6, h: 50, r: 3, fill: color.sky, alpha: 0.7 },
    ],
  },
  // Seen from the front: tank, flush button, a coloured seat on the white bowl.
  toilet: {
    id: 'toilet',
    label: 'Toilet',
    layer: 'stand',
    w: 110,
    h: 130,
    footY: 130,
    shapes: [
      {
        kind: 'rect',
        x: 18,
        y: 0,
        w: 74,
        h: 50,
        r: [14, 14, 6, 6],
        fill: '#FFFFFF',
        stroke: LINE4,
      },
      { kind: 'rect', x: 72, y: 8, w: 12, h: 36, r: 6, fill: INK, alpha: 0.07 },
      { kind: 'ellipse', x: 46, y: 10, w: 18, h: 11, fill: '#C9D1E3', stroke: THIN },
      {
        kind: 'rect',
        x: 34,
        y: 70,
        w: 42,
        h: 60,
        r: [6, 6, 12, 12],
        fill: '#FFFFFF',
        stroke: LINE4,
      },
      { kind: 'rect', x: 58, y: 76, w: 10, h: 48, r: 5, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 4, y: 46, w: 102, h: 34, r: 17, fill: '#FFFFFF', stroke: LINE4 },
      { kind: 'rect', x: 22, y: 64, w: 66, h: 9, r: 4, fill: INK, alpha: 0.08 },
      { kind: 'rect', x: 8, y: 44, w: 94, h: 14, r: 7, fill: color.cornflower, stroke: THIN },
      { kind: 'rect', x: 18, y: 47, w: 30, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.4 },
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
      {
        kind: 'rect',
        x: 6,
        y: 46,
        w: 128,
        h: 84,
        r: [4, 4, 12, 12],
        fill: color.cornflower,
        stroke: SOFT,
      },
      { kind: 'rect', x: 68, y: 56, w: 4, h: 64, r: 2, fill: INK, alpha: 0.3 },
      { kind: 'ellipse', x: 52, y: 80, w: 9, h: 9, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 79, y: 80, w: 9, h: 9, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 62, y: 4, w: 13, h: 34, r: 6, fill: '#C9D1E3', stroke: LINE4 },
      { kind: 'rect', x: 62, y: 4, w: 34, h: 12, r: 6, fill: '#C9D1E3', stroke: LINE4 },
      { kind: 'ellipse', x: 44, y: 22, w: 14, h: 12, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 80, y: 22, w: 14, h: 12, fill: color.cornflower, stroke: THIN },
      { kind: 'rect', x: 0, y: 34, w: 140, h: 18, r: 9, fill: '#FFFFFF', stroke: SOFT },
      { kind: 'rect', x: 26, y: 38, w: 88, h: 8, r: 4, fill: color.sky },
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
      { kind: 'rect', x: 0, y: 0, w: 18, h: 220, r: [9, 9, 3, 3], fill: color.wood, stroke: LINE4 },
      {
        kind: 'rect',
        x: 182,
        y: 0,
        w: 18,
        h: 220,
        r: [9, 9, 3, 3],
        fill: color.wood,
        stroke: LINE4,
      },
      { kind: 'rect', x: 16, y: 52, w: 168, h: 22, r: 8, fill: '#FFF8F0', stroke: LINE4 },
      { kind: 'rect', x: 78, y: 50, w: 106, h: 26, r: 8, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 78, y: 50, w: 106, h: 7, r: [8, 8, 0, 0], fill: '#FFFFFF', alpha: 0.35 },
      { kind: 'rect', x: 22, y: 42, w: 42, h: 18, r: 9, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 10, y: 72, w: 180, h: 14, r: 4, fill: color.wood, stroke: LINE4 },
      { kind: 'rect', x: 16, y: 168, w: 168, h: 22, r: 8, fill: '#FFF8F0', stroke: LINE4 },
      { kind: 'rect', x: 78, y: 166, w: 106, h: 26, r: 8, fill: color.teal, stroke: LINE4 },
      { kind: 'rect', x: 78, y: 166, w: 106, h: 7, r: [8, 8, 0, 0], fill: '#FFFFFF', alpha: 0.35 },
      { kind: 'rect', x: 22, y: 158, w: 42, h: 18, r: 9, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 10, y: 188, w: 180, h: 14, r: 4, fill: color.wood, stroke: LINE4 },
      { kind: 'rect', x: 60, y: 32, w: 124, h: 8, r: 4, fill: color.wood, stroke: THIN },
      { kind: 'rect', x: 150, y: 86, w: 6, h: 82, fill: color.woodDark },
      { kind: 'rect', x: 176, y: 86, w: 6, h: 82, fill: color.woodDark },
      { kind: 'rect', x: 150, y: 106, w: 32, h: 5, r: 2, fill: color.woodDark },
      { kind: 'rect', x: 150, y: 128, w: 32, h: 5, r: 2, fill: color.woodDark },
      { kind: 'rect', x: 150, y: 150, w: 32, h: 5, r: 2, fill: color.woodDark },
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
      { kind: 'rect', x: 14, y: 56, w: 112, h: 22, r: 8, fill: '#FFF8F0', stroke: LINE4 },
      { kind: 'rect', x: 40, y: 50, w: 60, h: 12, r: 6, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 28, y: 18, w: 7, h: 58, r: 3.5, fill: color.blossom },
      { kind: 'rect', x: 46, y: 18, w: 7, h: 58, r: 3.5, fill: color.blossom },
      { kind: 'rect', x: 64, y: 18, w: 7, h: 58, r: 3.5, fill: color.blossom },
      { kind: 'rect', x: 82, y: 18, w: 7, h: 58, r: 3.5, fill: color.blossom },
      { kind: 'rect', x: 100, y: 18, w: 7, h: 58, r: 3.5, fill: color.blossom },
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 14,
        h: 110,
        r: [7, 7, 3, 3],
        fill: color.blossom,
        stroke: LINE4,
      },
      {
        kind: 'rect',
        x: 126,
        y: 0,
        w: 14,
        h: 110,
        r: [7, 7, 3, 3],
        fill: color.blossom,
        stroke: LINE4,
      },
      { kind: 'rect', x: 0, y: 10, w: 140, h: 10, r: 5, fill: color.blossom, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 76, w: 140, h: 14, r: 7, fill: color.blossom, stroke: LINE4 },
      { kind: 'ellipse', x: 60, y: 80, w: 20, h: 8, fill: '#FFFFFF', alpha: 0.6 },
    ],
  },
  wardrobe: {
    id: 'wardrobe',
    label: 'Wardrobe',
    layer: 'wall',
    w: 150,
    h: 220,
    shapes: [
      { kind: 'rect', x: 14, y: 208, w: 16, h: 12, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 120, y: 208, w: 16, h: 12, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 4, y: 10, w: 142, h: 202, r: 10, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 0, y: 0, w: 150, h: 20, r: 8, fill: color.woodDark, stroke: LINE4 },
      { kind: 'rect', x: 16, y: 32, w: 50, h: 164, r: 6, fill: INK, alpha: 0.1 },
      { kind: 'rect', x: 84, y: 32, w: 50, h: 164, r: 6, fill: INK, alpha: 0.1 },
      { kind: 'rect', x: 73, y: 24, w: 4, h: 180, fill: INK },
      { kind: 'ellipse', x: 58, y: 104, w: 10, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 82, y: 104, w: 10, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 12, y: 30, w: 5, h: 120, r: 2.5, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 14, y: 108, w: 14, h: 12, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 102, y: 108, w: 14, h: 12, r: [0, 0, 4, 4], fill: INK },
      { kind: 'rect', x: 4, y: 6, w: 122, h: 104, r: 10, fill: color.teal, stroke: OUTLINE },
      { kind: 'rect', x: 0, y: 2, w: 130, h: 14, r: 7, fill: color.woodDark, stroke: LINE4 },
      { kind: 'rect', x: 14, y: 22, w: 102, h: 26, r: 6, fill: color.teal, stroke: THIN },
      { kind: 'ellipse', x: 58, y: 30.0, w: 14, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 14, y: 54, w: 102, h: 26, r: 6, fill: color.teal, stroke: THIN },
      { kind: 'ellipse', x: 58, y: 62.0, w: 14, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 14, y: 86, w: 102, h: 18, r: 6, fill: color.teal, stroke: THIN },
      { kind: 'ellipse', x: 58, y: 90.0, w: 14, h: 10, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 14, y: 24, w: 40, h: 3, r: 1.5, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'ellipse', x: 22, y: 100, w: 22, h: 18, fill: color.marigold, stroke: THIN },
      { kind: 'ellipse', x: 176, y: 100, w: 22, h: 18, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 186, y: 6, w: 10, h: 32, r: 5, fill: '#C9D1E3', stroke: LINE4 },
      { kind: 'rect', x: 164, y: 6, w: 32, h: 10, r: 5, fill: '#C9D1E3', stroke: LINE4 },
      {
        kind: 'rect',
        x: 6,
        y: 40,
        w: 208,
        h: 64,
        r: [6, 6, 40, 40],
        fill: '#FFFFFF',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 0, y: 34, w: 220, h: 16, r: 8, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'rect', x: 12, y: 37, w: 196, h: 8, r: 4, fill: color.sky },
      { kind: 'ellipse', x: 38, y: 16, w: 26, h: 26, fill: '#FFFFFF', stroke: THIN },
      { kind: 'ellipse', x: 62, y: 8, w: 18, h: 18, fill: '#FFFFFF', stroke: THIN },
      { kind: 'ellipse', x: 146, y: 18, w: 22, h: 22, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 20, y: 86, w: 180, h: 8, r: 4, fill: INK, alpha: 0.08 },
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
      { kind: 'rect', x: 76, y: 108, w: 18, h: 26, fill: INK },
      { kind: 'rect', x: 46, y: 130, w: 78, h: 16, r: 8, fill: color.night, stroke: LINE4 },
      { kind: 'rect', x: 0, y: 0, w: 170, h: 112, r: 14, fill: color.night, stroke: OUTLINE },
      { kind: 'rect', x: 12, y: 12, w: 146, h: 86, r: 8, fill: color.sky },
      { kind: 'ellipse', x: 112, y: 22, w: 24, h: 24, fill: color.marigold },
      { kind: 'rect', x: 28, y: 30, w: 44, h: 14, r: 7, fill: '#FFFFFF' },
      { kind: 'rect', x: 12, y: 76, w: 146, h: 22, r: [0, 0, 8, 8], fill: color.leaf },
      { kind: 'rect', x: 22, y: 18, w: 6, h: 40, r: 3, fill: '#FFFFFF', alpha: 0.45 },
      { kind: 'ellipse', x: 150, y: 100, w: 8, h: 8, fill: color.tomato },
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
        x: 10,
        y: 18,
        w: 180,
        h: 152,
        r: [0, 0, 6, 6],
        fill: '#D9C4B0',
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 20, y: 32, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 64, y: 32, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 108, y: 32, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 152, y: 32, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 20, y: 52, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 152, y: 52, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 20, y: 80, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 152, y: 80, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 20, y: 120, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 152, y: 120, w: 34, h: 14, r: 3, fill: INK, alpha: 0.07 },
      { kind: 'rect', x: 48, y: 62, w: 104, h: 108, r: [52, 52, 0, 0], fill: INK },
      { kind: 'ellipse', x: 70, y: 112, w: 60, h: 56, fill: color.tomato },
      { kind: 'ellipse', x: 84, y: 126, w: 32, h: 40, fill: color.marigold },
      { kind: 'rect', x: 58, y: 154, w: 84, h: 14, r: 7, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 0, y: 4, w: 200, h: 22, r: 8, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 8, y: 8, w: 120, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
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
        y: 44,
        w: 120,
        h: 96,
        r: [0, 0, 8, 8],
        fill: color.blossom,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 10, y: 90, w: 120, h: 6, fill: INK },
      { kind: 'rect', x: 24, y: 56, w: 28, h: 24, r: 4, fill: color.sky, stroke: THIN },
      { kind: 'rect', x: 88, y: 56, w: 28, h: 24, r: 4, fill: color.sky, stroke: THIN },
      { kind: 'rect', x: 24, y: 104, w: 28, h: 22, r: 4, fill: color.sky, stroke: THIN },
      {
        kind: 'rect',
        x: 80,
        y: 100,
        w: 26,
        h: 40,
        r: [13, 13, 0, 0],
        fill: color.woodDark,
        stroke: THIN,
      },
      { kind: 'ellipse', x: 98, y: 118, w: 5, h: 5, fill: color.marigold },
      {
        kind: 'rect',
        x: 0,
        y: 0,
        w: 140,
        h: 52,
        r: [44, 44, 6, 6],
        fill: color.tomato,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 14, y: 10, w: 40, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.3 },
      { kind: 'ellipse', x: 60, y: 16, w: 20, h: 20, fill: '#FFFFFF', stroke: THIN },
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
      { kind: 'ellipse', x: 4, y: 36, w: 28, h: 20, fill: color.tomato, stroke: THIN },
      { kind: 'rect', x: 32, y: 70, w: 10, h: 36, r: 3, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 106, y: 70, w: 10, h: 36, r: 3, fill: color.woodDark, stroke: THIN },
      { kind: 'rect', x: 4, y: 100, w: 142, h: 14, r: 7, fill: color.woodDark, stroke: LINE4 },
      { kind: 'ellipse', x: 22, y: 44, w: 104, h: 44, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 52, y: 40, w: 36, h: 14, r: 6, fill: color.teal, stroke: THIN },
      { kind: 'rect', x: 98, y: 12, w: 24, h: 52, r: 10, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 104, y: 0, w: 9, h: 14, r: 4, fill: color.marigold, stroke: THIN },
      { kind: 'rect', x: 92, y: 8, w: 12, h: 44, r: 6, fill: color.tomato, stroke: THIN },
      { kind: 'rect', x: 100, y: 6, w: 48, h: 26, r: 13, fill: color.marigold, stroke: LINE4 },
      { kind: 'ellipse', x: 136, y: 16, w: 8, h: 6, fill: INK, alpha: 0.5 },
      { kind: 'ellipse', x: 116, y: 11, w: 7, h: 7, fill: INK },
      { kind: 'rect', x: 108, y: 22, w: 22, h: 5, r: 2.5, fill: INK },
      { kind: 'rect', x: 34, y: 52, w: 40, h: 6, r: 3, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 78, y: 0, w: 4, h: 14, fill: INK },
      { kind: 'rect', x: 82, y: 0, w: 22, h: 12, r: 2, fill: color.teal, stroke: THIN },
      {
        kind: 'rect',
        x: 0,
        y: 10,
        w: 160,
        h: 120,
        r: [80, 80, 0, 0],
        fill: color.marigold,
        stroke: OUTLINE,
      },
      { kind: 'rect', x: 72, y: 12, w: 16, h: 118, r: 4, fill: color.tomato, alpha: 0.9 },
      {
        kind: 'rect',
        x: 50,
        y: 56,
        w: 60,
        h: 74,
        r: [30, 30, 0, 0],
        fill: color.tomato,
        stroke: LINE4,
      },
      { kind: 'rect', x: 62, y: 70, w: 36, h: 60, r: [18, 18, 0, 0], fill: INK, alpha: 0.55 },
      { kind: 'rect', x: 22, y: 40, w: 8, h: 60, r: 4, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 142, y: 22, w: 6, h: 108, fill: INK },
      { kind: 'ellipse', x: 118, y: 12, w: 54, h: 14, fill: color.marigold, stroke: LINE4 },
      { kind: 'rect', x: 32, y: 86, w: 6, h: 44, fill: INK },
      { kind: 'rect', x: 8, y: 56, w: 54, h: 32, r: 8, fill: color.cornflower, stroke: LINE4 },
      { kind: 'ellipse', x: 8, y: 50, w: 54, h: 14, fill: '#FFFFFF', stroke: LINE4 },
      { kind: 'ellipse', x: 48, y: 48, w: 84, h: 82, fill: '#FFFFFF', stroke: OUTLINE },
      { kind: 'ellipse', x: 62, y: 62, w: 56, h: 54, fill: color.tomato },
      { kind: 'ellipse', x: 80, y: 78, w: 20, h: 20, fill: '#FFFFFF', alpha: 0.6 },
      { kind: 'rect', x: 20, y: 34, w: 44, h: 5, r: 2, fill: color.woodDark },
      { kind: 'rect', x: 40, y: 28, w: 5, h: 24, r: 2, fill: color.woodDark },
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
      { kind: 'rect', x: 40, y: 26, w: 5, h: 48, fill: color.leaf },
      { kind: 'rect', x: 24, y: 34, w: 4, h: 40, fill: color.leaf },
      { kind: 'rect', x: 56, y: 30, w: 4, h: 44, fill: color.leaf },
      { kind: 'ellipse', x: 42, y: 46, w: 20, h: 10, fill: color.leaf, stroke: THIN },
      { kind: 'ellipse', x: 14, y: 50, w: 18, h: 10, fill: color.leaf, stroke: THIN },
      { kind: 'ellipse', x: 8, y: 14, w: 30, h: 30, fill: color.blossom, stroke: LINE4 },
      { kind: 'ellipse', x: 18, y: 24, w: 10, h: 10, fill: color.marigold },
      { kind: 'ellipse', x: 44, y: 0, w: 32, h: 32, fill: color.marigold, stroke: LINE4 },
      { kind: 'ellipse', x: 55, y: 11, w: 10, h: 10, fill: color.tomato },
      { kind: 'ellipse', x: 28, y: 28, w: 22, h: 22, fill: color.cornflower, stroke: LINE4 },
      { kind: 'ellipse', x: 35, y: 35, w: 8, h: 8, fill: '#FFFFFF' },
      {
        kind: 'rect',
        x: 10,
        y: 72,
        w: 60,
        h: 48,
        r: [4, 4, 16, 16],
        fill: color.tomato,
        stroke: LINE4,
      },
      { kind: 'rect', x: 4, y: 66, w: 72, h: 14, r: 7, fill: color.tomato, stroke: LINE4 },
      { kind: 'rect', x: 12, y: 70, w: 30, h: 4, r: 2, fill: '#FFFFFF', alpha: 0.3 },
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
      { kind: 'rect', x: 20, y: 10, w: 30, h: 80, r: 15, fill: INK },
      { kind: 'rect', x: 2, y: 30, w: 22, h: 40, r: 11, fill: INK },
      { kind: 'rect', x: 46, y: 18, w: 22, h: 40, r: 11, fill: INK },
      { kind: 'rect', x: 8, y: 50, w: 24, h: 18, r: 9, fill: INK },
      { kind: 'rect', x: 38, y: 40, w: 24, h: 18, r: 9, fill: INK },
      { kind: 'rect', x: 24, y: 14, w: 22, h: 72, r: 11, fill: '#5AAE5A' },
      { kind: 'rect', x: 6, y: 34, w: 14, h: 32, r: 7, fill: '#5AAE5A' },
      { kind: 'rect', x: 50, y: 22, w: 14, h: 32, r: 7, fill: '#5AAE5A' },
      { kind: 'rect', x: 12, y: 54, w: 16, h: 10, r: 5, fill: '#5AAE5A' },
      { kind: 'rect', x: 42, y: 44, w: 16, h: 10, r: 5, fill: '#5AAE5A' },
      { kind: 'rect', x: 30, y: 22, w: 3, h: 54, r: 1.5, fill: '#FFFFFF', alpha: 0.35 },
      { kind: 'ellipse', x: 28, y: 2, w: 14, h: 14, fill: color.blossom, stroke: THIN },
      {
        kind: 'rect',
        x: 12,
        y: 86,
        w: 46,
        h: 34,
        r: [4, 4, 12, 12],
        fill: '#E07A4F',
        stroke: LINE4,
      },
      { kind: 'rect', x: 8, y: 80, w: 54, h: 12, r: 6, fill: '#E07A4F', stroke: LINE4 },
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
      { kind: 'ellipse', x: -3, y: 25, w: 80, h: 68, fill: INK },
      { kind: 'ellipse', x: 63, y: 25, w: 80, h: 68, fill: INK },
      { kind: 'ellipse', x: 27, y: -3, w: 88, h: 88, fill: INK },
      { kind: 'ellipse', x: 2, y: 30, w: 70, h: 58, fill: color.tree },
      { kind: 'ellipse', x: 68, y: 30, w: 70, h: 58, fill: color.tree },
      { kind: 'ellipse', x: 32, y: 2, w: 78, h: 78, fill: color.tree },
      { kind: 'ellipse', x: 44, y: 14, w: 30, h: 16, fill: '#FFFFFF', alpha: 0.2 },
      { kind: 'ellipse', x: 14, y: 44, w: 22, h: 12, fill: '#FFFFFF', alpha: 0.15 },
      { kind: 'ellipse', x: 30, y: 54, w: 12, h: 12, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 76, y: 26, w: 12, h: 12, fill: color.tomato, stroke: THIN },
      { kind: 'ellipse', x: 102, y: 56, w: 12, h: 12, fill: color.tomato, stroke: THIN },
    ],
  },
  picture: {
    id: 'picture',
    label: 'Picture',
    layer: 'wall',
    w: 110,
    h: 90,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 110, h: 90, r: 8, fill: color.woodDark, stroke: OUTLINE },
      { kind: 'rect', x: 10, y: 10, w: 90, h: 70, r: 4, fill: '#FFFFFF' },
      { kind: 'rect', x: 16, y: 16, w: 78, h: 58, r: 3, fill: color.sky },
      { kind: 'ellipse', x: 70, y: 22, w: 16, h: 16, fill: color.marigold },
      { kind: 'ellipse', x: 18, y: 50, w: 74, h: 26, fill: color.leaf },
      { kind: 'rect', x: 16, y: 64, w: 78, h: 10, r: [0, 0, 3, 3], fill: color.leaf },
    ],
  },
  clock: {
    id: 'clock',
    label: 'Clock',
    layer: 'wall',
    w: 80,
    h: 80,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 80, h: 80, fill: color.teal, stroke: OUTLINE },
      { kind: 'ellipse', x: 10, y: 10, w: 60, h: 60, fill: '#FFFFFF', stroke: THIN },
      { kind: 'rect', x: 38, y: 13, w: 4, h: 8, r: 2, fill: INK },
      { kind: 'rect', x: 38, y: 59, w: 4, h: 8, r: 2, fill: INK },
      { kind: 'rect', x: 13, y: 38, w: 8, h: 4, r: 2, fill: INK },
      { kind: 'rect', x: 59, y: 38, w: 8, h: 4, r: 2, fill: INK },
      { kind: 'rect', x: 38, y: 20, w: 4, h: 22, r: 2, fill: INK },
      { kind: 'rect', x: 38, y: 38, w: 20, h: 4, r: 2, fill: INK },
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
      { kind: 'ellipse', x: 0, y: 0, w: 80, h: 130, fill: color.wood, stroke: OUTLINE },
      { kind: 'ellipse', x: 10, y: 10, w: 60, h: 110, fill: '#DDF0FF' },
      { kind: 'rect', x: 22, y: 26, w: 8, h: 40, r: 4, fill: '#FFFFFF', alpha: 0.85 },
      { kind: 'rect', x: 22, y: 72, w: 8, h: 10, r: 4, fill: '#FFFFFF', alpha: 0.85 },
    ],
  },
  bunting: {
    id: 'bunting',
    label: 'Party flags',
    layer: 'wall',
    w: 240,
    h: 50,
    shapes: [
      { kind: 'rect', x: 0, y: 4, w: 240, h: 4, r: 2, fill: INK },
      {
        kind: 'rect',
        x: 8,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.tomato,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 47,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.marigold,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 86,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.teal,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 125,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.blossom,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 164,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.cornflower,
        stroke: THIN,
      },
      {
        kind: 'rect',
        x: 203,
        y: 6,
        w: 28,
        h: 32,
        r: [0, 0, 14, 14],
        fill: color.leaf,
        stroke: THIN,
      },
    ],
  },
  roundRug: {
    id: 'roundRug',
    label: 'Round rug',
    layer: 'floor',
    w: 200,
    h: 70,
    shapes: [
      { kind: 'ellipse', x: 0, y: 0, w: 200, h: 70, fill: color.cornflower, stroke: SOFT },
      { kind: 'ellipse', x: 18, y: 8, w: 164, h: 54, fill: '#7C93F5' },
      { kind: 'ellipse', x: 48, y: 18, w: 104, h: 34, fill: color.cornflower },
      { kind: 'ellipse', x: 80, y: 28, w: 40, h: 14, fill: '#FFFFFF', alpha: 0.3 },
    ],
  },
  stripeRug: {
    id: 'stripeRug',
    label: 'Striped rug',
    layer: 'floor',
    w: 220,
    h: 64,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 220, h: 64, r: 12, fill: color.teal, stroke: SOFT },
      { kind: 'rect', x: 8, y: 12, w: 204, h: 8, r: 4, fill: color.marigold },
      { kind: 'rect', x: 8, y: 28, w: 204, h: 8, r: 4, fill: color.tomato },
      { kind: 'rect', x: 8, y: 44, w: 204, h: 8, r: 4, fill: '#FFFFFF', alpha: 0.7 },
    ],
  },
  // The hospital, the workshop, the shop and the airport (townFurniture.ts).
  ...townFurniture,
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
  /** Painted by the child: replaces the piece's main colour (see mainColour). */
  paint?: string;
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
  receptionDesk: 44,
  till: 58,
  checkInDesk: 58,
  workbench: 42,
  examBed: 26,
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
  | 'sit'
  | 'eat'
  | 'sleep'
  | 'home'
  | 'play'
  | 'music'
  | 'books'
  | 'plants'
  | 'walls'
  | 'floor'
  | 'town';

/** The furniture catalogue for decorating, by category (the icon names are from icons.ts). */
export const catalogue: { id: CatalogueId; icon: IconName; kinds: FurnitureKindId[] }[] = [
  { id: 'sit', icon: 'sofa', kinds: ['sofa', 'armchair', 'chair', 'beanbag', 'stool', 'bench'] },
  {
    id: 'eat',
    icon: 'fork',
    kinds: ['table', 'sideTable', 'cafeTable', 'counter', 'stove', 'fridge', 'sink', 'cakeStand'],
  },
  { id: 'sleep', icon: 'bed', kinds: ['bed', 'bunkBed', 'cot'] },
  {
    id: 'home',
    icon: 'rooms',
    kinds: ['wardrobe', 'drawers', 'bathtub', 'toilet', 'fireplace', 'tv'],
  },
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
  {
    // Pieces from the hospital, the workshop, the shop and the airport.
    id: 'town',
    icon: 'shop',
    kinds: [
      'examBed',
      'hospitalBed',
      'waitingChairs',
      'receptionDesk',
      'medCabinet',
      'eyeChart',
      'workbench',
      'toolWall',
      'woodPile',
      'carLift',
      'shopShelf',
      'till',
      'fruitStand',
      'basketStack',
      'gateSeats',
      'checkInDesk',
      'departureBoard',
      'bigWindow',
      'luggageCart',
      'windsock',
      'controlTower',
      'plane',
      'runwayLines',
    ],
  },
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

/** Colours a piece can be painted, in order (undefined: as designed). */
export const paints: (string | undefined)[] = [
  undefined,
  color.tomato,
  color.marigold,
  color.leaf,
  color.teal,
  color.cornflower,
  color.purple,
  color.blossom,
  '#FFF8F0',
];

/** The colour that most of a piece is drawn in (outlines and shading aside). */
export function mainColour(kind: FurnitureKind): string | undefined {
  const area = new Map<string, number>();
  for (const s of kind.shapes) {
    if (s.fill === INK || (s.alpha ?? 1) < 1) continue;
    area.set(s.fill, (area.get(s.fill) ?? 0) + s.w * s.h);
  }
  let best: string | undefined;
  let most = 0;
  for (const [fill, a] of area) {
    if (a > most) {
      best = fill;
      most = a;
    }
  }
  return best;
}

/** The shapes to draw, with the child's paint in place of the main colour. */
export function paintedShapes(kind: FurnitureKind, paint: string | undefined): Shape[] {
  const main = paint ? mainColour(kind) : undefined;
  if (!paint || !main) return kind.shapes;
  return kind.shapes.map((s) => (s.fill === main ? { ...s, fill: paint } : s));
}
