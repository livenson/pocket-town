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
} as const satisfies Record<string, FurnitureKind>;

export type FurnitureKindId = keyof typeof furnitureKinds;

export interface FurnitureInstance {
  id: string;
  kind: FurnitureKindId;
  /** Top-left of the piece in room units. */
  x: number;
  y: number;
}
