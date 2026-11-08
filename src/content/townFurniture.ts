// Furniture for the town's public places: the hospital, the workshop, the shop and
// the airport (owner's request). Same house style as furniture.ts: flat shapes, ink
// outlines, local coordinates (origin = top-left of the piece's box), room units.
import { color } from '../design/tokens';
import type { FurnitureKind, Shape, Stroke } from './furniture';

const INK = color.ink;
const OUTLINE: Stroke = { width: 6, color: INK };
const SOFT: Stroke = { width: 5, color: INK };
const LINE4: Stroke = { width: 4, color: INK };
const THIN: Stroke = { width: 3, color: INK };
const WHITE = '#FFFFFF';
/** Painted metal: frames, tools, the plane's wings. */
const STEEL = '#C9CED9';
const STEEL_DARK = '#9AA3B5';

const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  more: { r?: number | [number, number, number, number]; stroke?: Stroke; alpha?: number } = {},
): Shape => ({ kind: 'rect', x, y, w, h, fill, ...more });

const oval = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  more: { stroke?: Stroke; alpha?: number } = {},
): Shape => ({ kind: 'ellipse', x, y, w, h, fill, ...more });

/** A first-aid sign: a white cross on a round green badge (not the Red Cross emblem). */
function firstAid(x: number, y: number, d: number, stroke: Stroke = THIN): Shape[] {
  const bar = d * 0.2;
  const len = d * 0.6;
  return [
    oval(x, y, d, d, color.teal, { stroke }),
    rect(x + (d - bar) / 2, y + (d - len) / 2, bar, len, WHITE, { r: 3 }),
    rect(x + (d - len) / 2, y + (d - bar) / 2, len, bar, WHITE, { r: 3 }),
  ];
}

/** Three seats joined on one rail (the hospital's waiting room, the airport gate). */
function seatRow(fill: string): Shape[] {
  const seats = [0, 1, 2].flatMap((i) => {
    const x = 10 + i * 82;
    return [
      rect(x, 0, 74, 58, fill, { r: [20, 20, 8, 8], stroke: SOFT }),
      rect(x + 10, 8, 32, 6, WHITE, { r: 3, alpha: 0.3 }),
      rect(x - 2, 48, 78, 24, fill, { r: 11, stroke: SOFT }),
    ];
  });
  return [
    rect(24, 70, 10, 40, INK, { r: [0, 0, 3, 3] }),
    rect(226, 70, 10, 40, INK, { r: [0, 0, 3, 3] }),
    rect(10, 66, 240, 10, INK, { r: 5 }),
    ...seats,
  ];
}

/** A passenger plane seen from the side, nose to the right, wheels down. 520 × 218. */
function planeBody(dx: number, dy = 0): Shape[] {
  const at = (x: number, y: number, w: number, h: number) => [x + dx, y + dy, w, h] as const;
  const windows = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    oval(...at(132 + i * 40, 104, 18, 20), color.sky, { stroke: THIN }),
  );
  return [
    // Tail fin and tail wing.
    rect(...at(22, 0, 70, 96), color.tomato, { r: [44, 12, 0, 0], stroke: OUTLINE }),
    rect(...at(34, 14, 30, 8), WHITE, { r: 4, alpha: 0.35 }),
    // Wheels under the body.
    rect(...at(436, 160, 8, 34), INK),
    oval(...at(426, 188, 28, 28), INK),
    oval(...at(435, 197, 10, 10), STEEL),
    rect(...at(214, 160, 8, 34), INK),
    oval(...at(190, 188, 28, 28), INK),
    oval(...at(199, 197, 10, 10), STEEL),
    oval(...at(218, 188, 28, 28), INK),
    oval(...at(227, 197, 10, 10), STEEL),
    // The body: round nose, white with a tomato stripe.
    rect(...at(10, 80, 500, 86), WHITE, { r: [30, 43, 43, 30], stroke: OUTLINE }),
    rect(...at(16, 138, 488, 10), color.tomato),
    rect(...at(40, 88, 380, 6), color.sky, { r: 3, alpha: 0.6 }),
    ...windows,
    rect(...at(92, 98, 26, 48), WHITE, { r: 6, stroke: THIN }),
    rect(...at(436, 96, 52, 24), color.sky, { r: [6, 18, 4, 6], stroke: THIN }),
    oval(...at(6, 76, 92, 20), STEEL, { stroke: THIN }),
    // Wing and engine.
    oval(...at(176, 138, 210, 34), STEEL, { stroke: LINE4 }),
    rect(...at(236, 156, 92, 34), color.tomato, { r: 17, stroke: LINE4 }),
    oval(...at(306, 158, 22, 30), INK),
    rect(...at(244, 162, 50, 5), WHITE, { r: 2.5, alpha: 0.35 }),
  ];
}

/** The plane that takes off and lands on the runway (drawn by the stage, not furniture). */
export const flyingPlane: FurnitureKind = {
  id: 'flyingPlane',
  label: 'Plane',
  layer: 'stand',
  w: 520,
  h: 218,
  footY: 216,
  shapes: planeBody(0),
};

export const townFurniture = {
  // ——— Hospital ———
  receptionDesk: {
    id: 'receptionDesk',
    label: 'Reception desk',
    layer: 'stand',
    w: 300,
    h: 130,
    footY: 124,
    shapes: [
      rect(226, 44, 12, 14, INK),
      rect(200, 0, 64, 48, color.cornflower, { r: 8, stroke: LINE4 }),
      rect(209, 9, 46, 30, color.sky, { r: 4 }),
      rect(64, 26, 6, 10, INK, { r: 2 }),
      oval(50, 32, 34, 22, color.marigold, { stroke: THIN }),
      rect(6, 52, 288, 72, WHITE, { r: [0, 0, 12, 12], stroke: OUTLINE }),
      rect(0, 42, 300, 18, color.teal, { r: 9, stroke: LINE4 }),
      rect(12, 46, 110, 4, WHITE, { r: 2, alpha: 0.35 }),
      ...firstAid(128, 66, 44),
      rect(20, 116, 260, 6, INK, { r: 3, alpha: 0.12 }),
    ],
  },
  examBed: {
    id: 'examBed',
    label: "Doctor's bed",
    layer: 'stand',
    w: 240,
    h: 120,
    footY: 120,
    shapes: [
      rect(24, 60, 12, 60, STEEL_DARK, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(204, 60, 12, 60, STEEL_DARK, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(30, 92, 180, 8, STEEL_DARK, { r: 4, stroke: THIN }),
      rect(8, 50, 224, 18, STEEL, { r: 8, stroke: LINE4 }),
      rect(4, 24, 232, 32, color.teal, { r: [16, 16, 10, 10], stroke: SOFT }),
      rect(0, 6, 74, 42, color.teal, { r: [22, 14, 8, 8], stroke: SOFT }),
      rect(80, 28, 140, 12, WHITE, { r: 6, alpha: 0.85 }),
      rect(10, 0, 54, 22, WHITE, { r: 11, stroke: LINE4 }),
    ],
  },
  hospitalBed: {
    id: 'hospitalBed',
    label: 'Hospital bed',
    layer: 'stand',
    w: 220,
    h: 130,
    footY: 130,
    shapes: [
      rect(0, 0, 22, 112, STEEL, { r: [11, 11, 3, 3], stroke: LINE4 }),
      rect(8, 16, 6, 60, INK, { r: 3, alpha: 0.15 }),
      rect(198, 34, 22, 78, STEEL, { r: [11, 11, 3, 3], stroke: LINE4 }),
      rect(10, 86, 200, 14, STEEL, { r: 5, stroke: LINE4 }),
      oval(16, 106, 24, 24, INK),
      oval(24, 114, 8, 8, STEEL),
      oval(180, 106, 24, 24, INK),
      oval(188, 114, 8, 8, STEEL),
      rect(14, 62, 192, 28, color.paper, { r: 8, stroke: LINE4 }),
      rect(72, 52, 134, 40, color.leaf, { r: [8, 12, 12, 8], stroke: SOFT }),
      rect(72, 52, 134, 11, WHITE, { r: [8, 12, 0, 0], alpha: 0.35 }),
      rect(20, 40, 54, 24, WHITE, { r: 12, stroke: LINE4 }),
    ],
  },
  waitingChairs: {
    id: 'waitingChairs',
    label: 'Waiting chairs',
    layer: 'stand',
    w: 260,
    h: 110,
    footY: 110,
    shapes: seatRow(color.cornflower),
  },
  medCabinet: {
    id: 'medCabinet',
    label: 'Medicine cupboard',
    layer: 'wall',
    w: 130,
    h: 160,
    shapes: [
      rect(0, 24, 130, 136, WHITE, { r: 12, stroke: OUTLINE }),
      rect(62, 34, 6, 116, INK, { r: 3, alpha: 0.2 }),
      oval(44, 84, 10, 10, color.marigold, { stroke: THIN }),
      oval(76, 84, 10, 10, color.marigold, { stroke: THIN }),
      rect(12, 140, 106, 8, INK, { r: 4, alpha: 0.08 }),
      ...firstAid(39, 0, 52, LINE4),
    ],
  },
  eyeChart: {
    id: 'eyeChart',
    label: 'Eye chart',
    layer: 'wall',
    w: 100,
    h: 156,
    // Pictures, not letters: big to small.
    shapes: [
      rect(0, 6, 100, 150, WHITE, { r: 10, stroke: LINE4 }),
      oval(44, 0, 12, 12, color.tomato, { stroke: THIN }),
      oval(32, 20, 36, 36, color.tomato, { stroke: THIN }),
      oval(22, 66, 22, 22, color.teal, { stroke: THIN }),
      oval(56, 66, 22, 22, color.marigold, { stroke: THIN }),
      oval(17, 100, 15, 15, color.cornflower, { stroke: THIN }),
      oval(42, 100, 15, 15, color.leaf, { stroke: THIN }),
      oval(67, 100, 15, 15, color.blossom, { stroke: THIN }),
      ...[0, 1, 2, 3].map((i) => oval(18 + i * 18, 128, 9, 9, INK, { alpha: 0.8 })),
    ],
  },

  // ——— Workshop ———
  workbench: {
    id: 'workbench',
    label: 'Workbench',
    layer: 'stand',
    w: 280,
    h: 140,
    footY: 140,
    shapes: [
      rect(14, 54, 16, 86, color.woodDark, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(250, 54, 16, 86, color.woodDark, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(18, 106, 244, 12, color.woodDark, { r: 4, stroke: THIN }),
      rect(42, 86, 40, 22, color.tomato, { r: 4, stroke: THIN }),
      rect(178, 90, 52, 18, color.cornflower, { r: 4, stroke: THIN }),
      // A birdhouse being built, a hammer and the vice.
      rect(112, 8, 50, 36, color.marigold, { r: 4, stroke: LINE4 }),
      rect(105, 0, 64, 14, color.tomato, { r: 7, stroke: THIN }),
      oval(130, 18, 14, 14, INK),
      rect(44, 32, 52, 7, color.woodDeep, { r: 3.5 }),
      rect(34, 24, 16, 18, STEEL_DARK, { r: 4, stroke: THIN }),
      rect(226, 24, 36, 20, STEEL_DARK, { r: 4, stroke: THIN }),
      rect(258, 30, 18, 7, INK, { r: 3.5 }),
      rect(0, 40, 280, 22, color.wood, { r: 8, stroke: SOFT }),
      rect(10, 44, 120, 4, WHITE, { r: 2, alpha: 0.3 }),
    ],
  },
  toolWall: {
    id: 'toolWall',
    label: 'Tool wall',
    layer: 'wall',
    w: 240,
    h: 170,
    shapes: [
      rect(0, 0, 240, 170, color.woodLight, { r: 12, stroke: OUTLINE }),
      ...[0, 1, 2].flatMap((row) =>
        [0, 1, 2, 3, 4, 5].map((col) =>
          oval(22 + col * 38, 18 + row * 64, 6, 6, INK, { alpha: 0.15 }),
        ),
      ),
      // Hammer.
      rect(31, 42, 10, 92, color.woodDark, { r: 5, stroke: THIN }),
      rect(16, 26, 40, 20, STEEL_DARK, { r: 5, stroke: THIN }),
      // Spanner.
      rect(80, 46, 12, 92, STEEL_DARK, { r: 6, stroke: THIN }),
      oval(70, 24, 32, 30, STEEL_DARK, { stroke: THIN }),
      oval(79, 20, 14, 14, color.woodLight),
      // Saw.
      rect(120, 34, 32, 100, STEEL, { r: [4, 4, 16, 4], stroke: THIN }),
      rect(114, 18, 44, 26, color.tomato, { r: 10, stroke: THIN }),
      oval(127, 24, 18, 12, color.woodLight),
      // Screwdriver and a tape measure.
      rect(182, 22, 20, 44, color.marigold, { r: 8, stroke: THIN }),
      rect(189, 64, 6, 48, STEEL_DARK, { r: 2 }),
      oval(176, 120, 38, 36, color.teal, { stroke: THIN }),
      oval(187, 131, 16, 14, WHITE),
    ],
  },
  woodPile: {
    id: 'woodPile',
    label: 'Wooden planks',
    layer: 'stand',
    w: 160,
    h: 80,
    footY: 80,
    shapes: [
      rect(0, 56, 160, 22, color.wood, { r: 6, stroke: LINE4 }),
      oval(6, 61, 12, 12, color.woodDark, { stroke: THIN }),
      rect(12, 34, 140, 22, color.woodLight, { r: 6, stroke: LINE4 }),
      oval(18, 39, 12, 12, color.wood, { stroke: THIN }),
      rect(26, 12, 112, 22, color.wood, { r: 6, stroke: LINE4 }),
      oval(32, 17, 12, 12, color.woodDark, { stroke: THIN }),
      rect(50, 18, 70, 4, WHITE, { r: 2, alpha: 0.3 }),
    ],
  },
  carLift: {
    id: 'carLift',
    label: 'Car to fix',
    layer: 'stand',
    w: 300,
    h: 172,
    footY: 168,
    shapes: [
      rect(8, 20, 18, 148, color.marigold, { r: 4, stroke: LINE4 }),
      rect(274, 20, 18, 148, color.marigold, { r: 4, stroke: LINE4 }),
      rect(16, 128, 268, 16, STEEL_DARK, { r: 6, stroke: LINE4 }),
      // The little car, one wheel off.
      rect(90, 22, 112, 50, color.tomato, { r: [24, 24, 4, 4], stroke: OUTLINE }),
      rect(104, 32, 40, 28, color.sky, { r: [12, 4, 2, 2], stroke: THIN }),
      rect(150, 32, 40, 28, color.sky, { r: [4, 12, 2, 2], stroke: THIN }),
      rect(50, 62, 200, 50, color.tomato, { r: 22, stroke: OUTLINE }),
      rect(62, 70, 90, 6, WHITE, { r: 3, alpha: 0.35 }),
      oval(230, 74, 14, 12, color.marigold, { stroke: THIN }),
      oval(68, 92, 42, 42, INK),
      oval(80, 104, 18, 18, STEEL),
      oval(188, 92, 42, 42, INK, { alpha: 0.25 }),
      oval(196, 140, 50, 28, INK),
      oval(212, 148, 18, 12, STEEL),
      rect(0, 162, 300, 10, INK, { r: 5, alpha: 0.12 }),
    ],
  },

  // ——— Shop ———
  shopShelf: {
    id: 'shopShelf',
    label: 'Shop shelf',
    layer: 'wall',
    w: 240,
    h: 220,
    shapes: [
      rect(0, 0, 240, 220, color.teal, { r: 10, stroke: OUTLINE }),
      rect(12, 12, 216, 196, color.paper, { r: 4 }),
      // Top shelf: cereal boxes, jars, tins.
      rect(20, 28, 30, 48, color.tomato, { r: 3, stroke: THIN }),
      rect(26, 40, 18, 12, WHITE, { r: 6, alpha: 0.7 }),
      rect(54, 34, 30, 42, color.marigold, { r: 3, stroke: THIN }),
      rect(96, 46, 26, 30, color.blossom, { r: 8, stroke: THIN }),
      rect(98, 40, 22, 8, INK, { r: 3 }),
      rect(126, 46, 26, 30, color.leaf, { r: 8, stroke: THIN }),
      rect(128, 40, 22, 8, INK, { r: 3 }),
      rect(164, 48, 24, 28, color.cornflower, { r: 4, stroke: THIN }),
      rect(192, 48, 24, 28, color.cornflower, { r: 4, stroke: THIN }),
      rect(166, 58, 20, 6, WHITE, { alpha: 0.6 }),
      rect(194, 58, 20, 6, WHITE, { alpha: 0.6 }),
      rect(6, 76, 228, 10, color.teal, { r: 4, stroke: THIN }),
      // Middle shelf: bottles, apples, bread, milk.
      rect(22, 104, 18, 42, color.leaf, { r: [6, 6, 4, 4], stroke: THIN }),
      rect(26, 96, 10, 10, INK, { r: 2 }),
      oval(58, 120, 26, 26, color.tomato, { stroke: THIN }),
      oval(84, 120, 26, 26, color.tomato, { stroke: THIN }),
      oval(71, 98, 26, 26, color.tomato, { stroke: THIN }),
      rect(120, 118, 54, 28, color.wood, { r: 14, stroke: THIN }),
      rect(132, 124, 30, 4, WHITE, { r: 2, alpha: 0.4 }),
      rect(186, 104, 26, 42, WHITE, { r: 3, stroke: THIN }),
      rect(190, 96, 18, 10, color.cornflower, { r: 2, stroke: THIN }),
      rect(6, 146, 228, 10, color.teal, { r: 4, stroke: THIN }),
      // Bottom shelf: a box, a ball, two parcels.
      rect(20, 168, 60, 38, color.purple, { r: 6, stroke: THIN }),
      oval(96, 172, 34, 34, color.marigold, { stroke: THIN }),
      rect(144, 164, 34, 42, color.heart, { r: 4, stroke: THIN }),
      rect(184, 176, 40, 30, color.cornflower, { r: 4, stroke: THIN }),
      rect(6, 204, 228, 10, color.teal, { r: 4, stroke: THIN }),
    ],
  },
  till: {
    id: 'till',
    label: 'Till',
    layer: 'stand',
    w: 260,
    h: 140,
    footY: 132,
    shapes: [
      rect(176, 0, 48, 32, color.sky, { r: 6, stroke: THIN }),
      rect(186, 30, 8, 8, INK),
      rect(160, 32, 84, 34, color.cornflower, { r: 8, stroke: LINE4 }),
      oval(172, 40, 10, 10, WHITE),
      oval(190, 40, 10, 10, WHITE),
      oval(208, 40, 10, 10, WHITE),
      oval(226, 40, 10, 10, color.marigold),
      // Shopping on the belt.
      oval(26, 34, 24, 24, color.tomato, { stroke: THIN }),
      oval(60, 40, 32, 20, color.marigold, { stroke: THIN }),
      rect(104, 28, 28, 32, WHITE, { r: 4, stroke: THIN }),
      rect(108, 22, 20, 8, color.cornflower, { r: 2, stroke: THIN }),
      rect(6, 64, 248, 68, color.marigold, { r: [0, 0, 12, 12], stroke: OUTLINE }),
      rect(20, 84, 220, 8, WHITE, { r: 4, alpha: 0.4 }),
      rect(0, 56, 260, 16, color.woodDark, { r: 8, stroke: LINE4 }),
      rect(10, 59, 140, 8, INK, { r: 4, alpha: 0.45 }),
      rect(20, 124, 220, 6, INK, { r: 3, alpha: 0.12 }),
    ],
  },
  basketStack: {
    id: 'basketStack',
    label: 'Baskets',
    layer: 'stand',
    w: 92,
    h: 96,
    footY: 96,
    shapes: [
      rect(14, 0, 8, 40, INK, { r: 4 }),
      rect(70, 0, 8, 40, INK, { r: 4 }),
      rect(14, 0, 64, 8, INK, { r: 4 }),
      rect(0, 30, 92, 24, color.tomato, { r: [4, 4, 10, 10], stroke: LINE4 }),
      rect(0, 50, 92, 24, color.tomato, { r: [4, 4, 10, 10], stroke: LINE4 }),
      rect(0, 70, 92, 26, color.tomato, { r: [4, 4, 12, 12], stroke: LINE4 }),
      ...[18, 36, 54, 72].map((x) => rect(x, 76, 4, 14, WHITE, { r: 2, alpha: 0.5 })),
    ],
  },
  fruitStand: {
    id: 'fruitStand',
    label: 'Fruit stand',
    layer: 'stand',
    w: 264,
    h: 150,
    footY: 146,
    shapes: [
      rect(14, 90, 14, 56, color.woodDark, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(236, 90, 14, 56, color.woodDark, { r: [0, 0, 4, 4], stroke: LINE4 }),
      rect(10, 118, 244, 12, color.woodDark, { r: 4, stroke: THIN }),
      // Apples, lemons and pears, piled up in their crates.
      ...(
        [
          [color.tomato, 8],
          [color.marigold, 92],
          [color.leaf, 176],
        ] as const
      ).flatMap(([fill, x]) => {
        return [
          oval(x + 4, 40, 26, 26, fill, { stroke: THIN }),
          oval(x + 28, 40, 26, 26, fill, { stroke: THIN }),
          oval(x + 52, 40, 26, 26, fill, { stroke: THIN }),
          oval(x + 16, 22, 26, 26, fill, { stroke: THIN }),
          oval(x + 40, 22, 26, 26, fill, { stroke: THIN }),
          oval(x + 28, 6, 26, 26, fill, { stroke: THIN }),
        ];
      }),
      rect(6, 60, 82, 38, color.wood, { r: 6, stroke: LINE4 }),
      rect(90, 60, 82, 38, color.wood, { r: 6, stroke: LINE4 }),
      rect(174, 60, 84, 38, color.wood, { r: 6, stroke: LINE4 }),
      rect(12, 76, 70, 4, INK, { r: 2, alpha: 0.2 }),
      rect(96, 76, 70, 4, INK, { r: 2, alpha: 0.2 }),
      rect(180, 76, 72, 4, INK, { r: 2, alpha: 0.2 }),
    ],
  },

  // ——— Airport ———
  bigWindow: {
    id: 'bigWindow',
    label: 'Big window',
    layer: 'wall',
    w: 400,
    h: 200,
    // Drawn by the stage like a window (sky by time of day, a plane passing by).
    shapes: [
      rect(4, 4, 392, 192, color.sky, { r: 22, stroke: { width: 8, color: INK } }),
      rect(196, 0, 8, 200, INK),
      rect(28, 120, 60, 22, WHITE, { r: 11 }),
    ],
  },
  gateSeats: {
    id: 'gateSeats',
    label: 'Airport seats',
    layer: 'stand',
    w: 260,
    h: 110,
    footY: 110,
    shapes: seatRow(color.marigold),
  },
  departureBoard: {
    id: 'departureBoard',
    label: 'Departure board',
    layer: 'wall',
    w: 260,
    h: 140,
    // Planes, colours and lights: no words to read.
    shapes: [
      rect(40, 0, 6, 34, INK),
      rect(214, 0, 6, 34, INK),
      rect(0, 30, 260, 110, color.night, { r: 12, stroke: OUTLINE }),
      ...(
        [
          [color.marigold, color.leaf],
          [color.teal, color.marigold],
          [color.blossom, color.leaf],
        ] as const
      ).flatMap(([where, light], i) => {
        const y = 46 + i * 30;
        return [
          rect(18, y + 5, 28, 8, WHITE, { r: 4 }),
          rect(27, y, 8, 18, WHITE, { r: 3 }),
          rect(58, y + 2, 120, 14, where, { r: 7 }),
          oval(214, y + 1, 16, 16, light),
        ];
      }),
    ],
  },
  checkInDesk: {
    id: 'checkInDesk',
    label: 'Check-in desk',
    layer: 'stand',
    w: 280,
    h: 130,
    footY: 124,
    shapes: [
      rect(62, 46, 12, 14, INK),
      rect(40, 10, 56, 40, INK, { r: 6 }),
      rect(46, 16, 44, 28, color.sky, { r: 4 }),
      rect(212, 20, 26, 14, INK, { r: 6 }),
      rect(190, 30, 70, 50, color.tomato, { r: 10, stroke: LINE4 }),
      rect(194, 50, 62, 6, WHITE, { alpha: 0.5 }),
      rect(6, 64, 268, 60, color.cornflower, { r: [0, 0, 12, 12], stroke: OUTLINE }),
      rect(0, 56, 280, 16, WHITE, { r: 8, stroke: LINE4 }),
      rect(176, 59, 94, 8, INK, { r: 4, alpha: 0.3 }),
      // Luggage tags in the departure board's colours.
      rect(70, 86, 120, 26, WHITE, { r: 13, stroke: THIN }),
      oval(84, 92, 14, 14, color.marigold),
      oval(122, 92, 14, 14, color.teal),
      oval(160, 92, 14, 14, color.blossom),
      rect(20, 116, 240, 6, INK, { r: 3, alpha: 0.12 }),
    ],
  },
  plane: {
    id: 'plane',
    label: 'Plane',
    layer: 'stand',
    w: 580,
    h: 218,
    footY: 216,
    // Parked at the gate with its steps down to the ground.
    shapes: [
      ...planeBody(60),
      ...[0, 1, 2, 3, 4].map((i) =>
        rect(104 - i * 16, 146 + i * 14, 58, 14, color.marigold, { r: 3, stroke: THIN }),
      ),
      rect(36, 200, 130, 16, color.marigold, { r: 5, stroke: LINE4 }),
      rect(150, 140, 6, 62, INK, { r: 3 }),
    ],
  },
  controlTower: {
    id: 'controlTower',
    label: 'Control tower',
    layer: 'wall',
    w: 130,
    h: 340,
    shapes: [
      rect(62, 6, 6, 40, INK),
      oval(56, 0, 18, 18, color.tomato, { stroke: THIN }),
      rect(44, 116, 42, 224, color.paper, { stroke: OUTLINE }),
      rect(50, 160, 30, 8, color.tomato, { alpha: 0.8 }),
      rect(50, 230, 30, 8, color.tomato, { alpha: 0.8 }),
      rect(50, 300, 30, 8, color.tomato, { alpha: 0.8 }),
      rect(20, 40, 90, 22, color.tomato, { r: [10, 10, 0, 0], stroke: LINE4 }),
      rect(10, 56, 110, 66, color.cornflower, { r: 14, stroke: OUTLINE }),
      rect(20, 68, 90, 30, color.sky, { r: 8, stroke: THIN }),
      rect(63, 68, 4, 30, INK),
    ],
  },
  windsock: {
    id: 'windsock',
    label: 'Windsock',
    layer: 'stand',
    w: 112,
    h: 200,
    footY: 200,
    shapes: [
      rect(10, 0, 8, 196, INK, { r: 3 }),
      rect(18, 10, 30, 32, color.tomato, { r: [0, 6, 6, 0], stroke: THIN }),
      rect(46, 13, 30, 26, WHITE, { stroke: THIN }),
      rect(74, 16, 30, 20, color.tomato, { r: [0, 10, 10, 0], stroke: THIN }),
      oval(0, 190, 28, 10, INK),
    ],
  },
  luggageCart: {
    id: 'luggageCart',
    label: 'Luggage cart',
    layer: 'stand',
    w: 182,
    h: 112,
    footY: 112,
    shapes: [
      rect(168, 24, 10, 56, INK, { r: 4 }),
      rect(30, 22, 20, 12, INK, { r: 5 }),
      rect(10, 30, 60, 44, color.teal, { r: 8, stroke: LINE4 }),
      oval(24, 44, 14, 14, color.marigold),
      rect(86, 0, 40, 34, color.purple, { r: 8, stroke: LINE4 }),
      rect(76, 32, 56, 42, color.blossom, { r: 8, stroke: LINE4 }),
      rect(0, 70, 182, 16, color.marigold, { r: 6, stroke: LINE4 }),
      oval(14, 84, 28, 28, INK),
      oval(22, 92, 12, 12, STEEL),
      oval(140, 84, 28, 28, INK),
      oval(148, 92, 12, 12, STEEL),
    ],
  },
  runwayLines: {
    id: 'runwayLines',
    label: 'Runway lines',
    layer: 'floor',
    w: 880,
    h: 30,
    shapes: [
      rect(0, 0, 880, 30, '#7E879A', { r: 15, stroke: { width: 3, color: INK } }),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => rect(28 + i * 96, 12, 56, 6, WHITE, { r: 3 })),
    ],
  },
} as const satisfies Record<string, FurnitureKind>;
