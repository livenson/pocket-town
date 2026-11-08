// The live rows of the airport's departure board, drawn over the board's picture.
// Each row: where it goes (a little picture, never a flag), the time in clock
// digits, and the status as a coloured pill whose icon has its own shape (colour is
// never the only signal). A row that changes turns over gently; calm motion swaps
// it at once. Coordinates are the board piece's own (see townFurniture.ts).
import { Container, Graphics } from 'pixi.js';
import { minuteOfDay } from '../sim/clock';
import { color } from '../design/tokens';
import {
  boardNow,
  boardRows,
  clockDigits,
  runwayStatus,
  type BoardRow,
  type Destination,
  type FlightStatus,
} from './board';
import { hex } from './draw';

export const BOARD_ROWS = 4;
const ROW_Y = 40;
const ROW_H = 31;
const FLIP_SECONDS = 0.5;

const INK = hex(color.ink);
const WHITE = 0xffffff;
const AMBER = hex(color.marigold);

const STATUS_FILL: Record<FlightStatus, string> = {
  boarding: color.marigold,
  onTime: color.leaf,
  delayed: color.tomato,
  departed: color.cornflower,
  landed: color.teal,
};
/** Icon colour on each pill, picked for contrast. */
const STATUS_INK: Record<FlightStatus, number> = {
  boarding: INK,
  onTime: INK,
  delayed: WHITE,
  departed: WHITE,
  landed: WHITE,
};

// Seven-segment digits: which of a–g are lit.
const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};
const DIGIT_W = 15;
const DIGIT_H = 21;
const SEG = 3.5;

function drawDigit(g: Graphics, x: number, y: number, d: string): void {
  const lit = SEGMENTS[d] ?? '';
  const half = DIGIT_H / 2;
  const segs: Record<string, [number, number, number, number]> = {
    a: [x + SEG / 2, y, DIGIT_W - SEG, SEG],
    b: [x + DIGIT_W - SEG, y + SEG / 2, SEG, half - SEG / 2],
    c: [x + DIGIT_W - SEG, y + half, SEG, half - SEG / 2],
    d: [x + SEG / 2, y + DIGIT_H - SEG, DIGIT_W - SEG, SEG],
    e: [x, y + half, SEG, half - SEG / 2],
    f: [x, y + SEG / 2, SEG, half - SEG / 2],
    g: [x + SEG / 2, y + half - SEG / 2, DIGIT_W - SEG, SEG],
  };
  for (const [name, [sx, sy, w, h]] of Object.entries(segs)) {
    g.roundRect(sx, sy, w, h, SEG / 2).fill({ color: AMBER, alpha: lit.includes(name) ? 1 : 0.12 });
  }
}

function drawTime(g: Graphics, x: number, y: number, text: string): void {
  let cx = x;
  for (const ch of text) {
    if (ch === ':') {
      g.circle(cx + 2.5, y + 6, 2.2).fill(AMBER);
      g.circle(cx + 2.5, y + DIGIT_H - 6, 2.2).fill(AMBER);
      cx += 8;
    } else {
      drawDigit(g, cx, y, ch);
      cx += DIGIT_W + 4;
    }
  }
}

/** A destination picture in a 26 × 26 tile at (x, y). */
function drawDestination(g: Graphics, x: number, y: number, d: Destination): void {
  g.roundRect(x, y, 26, 26, 7).fill(hex(color.sky));
  switch (d) {
    case 'beach':
      g.circle(x + 18, y + 8, 5).fill(hex(color.marigold));
      g.rect(x, y + 14, 26, 5).fill(hex(color.water));
      g.roundRect(x, y + 17, 26, 9, 7).fill(hex(color.path));
      g.rect(x, y + 17, 26, 4).fill(hex(color.path));
      break;
    case 'snow':
      g.poly([x + 2, y + 24, x + 13, y + 5, x + 24, y + 24]).fill(hex('#9AA3B5'));
      g.poly([x + 9, y + 12, x + 13, y + 5, x + 17, y + 12, x + 13, y + 10]).fill(WHITE);
      g.circle(x + 5, y + 6, 1.4).fill(WHITE);
      g.circle(x + 21, y + 9, 1.4).fill(WHITE);
      break;
    case 'castle':
      g.rect(x + 5, y + 10, 16, 15).fill(hex(color.blossom));
      for (const cx of [x + 5, x + 11, x + 17]) g.rect(cx, y + 6, 4, 5).fill(hex(color.blossom));
      g.roundRect(x + 10, y + 16, 6, 9, 3).fill(INK);
      g.rect(x + 12.5, y + 1, 1.2, 6).fill(INK);
      g.poly([x + 13.7, y + 1, x + 19, y + 3, x + 13.7, y + 5]).fill(hex(color.tomato));
      break;
    case 'island':
      g.rect(x, y + 19, 26, 7).fill(hex(color.water));
      g.ellipse(x + 13, y + 20, 10, 4).fill(hex(color.path));
      g.poly([x + 12, y + 20, x + 14, y + 9, x + 16, y + 9, x + 15, y + 20]).fill(
        hex(color.woodDark),
      );
      g.ellipse(x + 9, y + 9, 6, 2.6).fill(hex(color.tree));
      g.ellipse(x + 20, y + 9, 6, 2.6).fill(hex(color.tree));
      g.ellipse(x + 15, y + 6, 4, 3).fill(hex(color.leaf));
      break;
    case 'city':
      g.rect(x + 3, y + 11, 6, 15).fill(hex(color.cornflower));
      g.rect(x + 10, y + 4, 7, 22).fill(hex(color.purple));
      g.rect(x + 18, y + 14, 5, 12).fill(hex(color.teal));
      for (const [wx, wy] of [
        [12, 7],
        [14.5, 7],
        [12, 12],
        [14.5, 12],
        [12, 17],
        [14.5, 17],
        [5, 15],
        [5, 20],
      ] as const)
        g.rect(x + wx, y + wy, 1.6, 2.4).fill(WHITE);
      break;
  }
}

/** A tiny plane, nose right, centred on (0, 0). */
function drawPlane(g: Graphics, fill: number): void {
  g.ellipse(0, 0, 9, 2.6).fill(fill);
  g.poly([-2, -1, 3, -1, -3, -8, -6, -8]).fill(fill);
  g.poly([-2, 1, 3, 1, -3, 8, -6, 8]).fill(fill);
  g.poly([-9, 0, -6, 0, -9, -5, -11, -5]).fill(fill);
}

/** The status pill: colour plus an icon with its own shape. */
function drawStatus(row: Container, x: number, y: number, s: FlightStatus): void {
  const g = new Graphics();
  const w = 74;
  const h = 26;
  g.roundRect(x, y, w, h, h / 2).fill(hex(STATUS_FILL[s]));
  const ink = STATUS_INK[s];
  const cx = x + w / 2;
  const cy = y + h / 2;
  const line = { width: 3, color: ink, cap: 'round' as const, join: 'round' as const };
  switch (s) {
    case 'onTime':
      g.moveTo(cx - 8, cy)
        .lineTo(cx - 2, cy + 6)
        .lineTo(cx + 9, cy - 6)
        .stroke(line);
      break;
    case 'delayed':
      g.circle(cx, cy, 8.5).stroke({ ...line, width: 2.6 });
      g.moveTo(cx, cy - 5)
        .lineTo(cx, cy)
        .lineTo(cx + 4, cy + 2)
        .stroke({ ...line, width: 2.4 });
      break;
    case 'boarding':
      // An arrow going in through a door.
      g.roundRect(cx + 1, cy - 9, 11, 18, 2).stroke({ ...line, width: 2.6 });
      g.moveTo(cx - 13, cy)
        .lineTo(cx + 4, cy)
        .stroke(line);
      g.moveTo(cx - 1, cy - 4)
        .lineTo(cx + 4, cy)
        .lineTo(cx - 1, cy + 4)
        .stroke(line);
      break;
    case 'departed':
    case 'landed': {
      // Climbing away above the ground, or coming down onto it.
      const up = s === 'departed';
      g.moveTo(cx - 14, cy + 9)
        .lineTo(cx + 14, cy + 9)
        .stroke({ ...line, width: 2.4 });
      const plane = new Graphics();
      drawPlane(plane, ink);
      plane.position.set(cx + (up ? 2 : 0), cy - 1);
      plane.rotation = up ? -0.5 : 0.45;
      row.addChild(g, plane);
      return;
    }
  }
  row.addChild(g);
}

function drawRow(row: Container, r: BoardRow): void {
  row.removeChildren().forEach((c) => c.destroy({ children: true }));
  const g = new Graphics();
  drawDestination(g, 0, 0, r.destination);
  drawTime(g, 38, 2.5, clockDigits(r.time));
  row.addChild(g);
  drawStatus(row, 164, 0, r.status);
}

const signature = (r: BoardRow) => `${r.flight}|${r.destination}|${r.time}|${r.status}`;

interface RowView {
  c: Container;
  shown: string;
  /** Seconds into a turn-over (null: still). */
  flip: number | null;
  next: BoardRow | null;
}

export class BoardView extends Container {
  private readonly rows: RowView[] = [];
  private runwayCycle = -1;
  private runwayTime = 0;
  private lastSeconds: number | null = null;

  constructor() {
    super();
    // Covers the picture's still rows.
    const panel = new Graphics().roundRect(8, 36, 244, 128, 8).fill(hex(color.night));
    this.addChild(panel);
    for (let i = 0; i < BOARD_ROWS; i++) {
      const c = new Container();
      c.position.set(12, ROW_Y + i * ROW_H + 13);
      c.pivot.set(0, 13);
      this.addChild(c);
      this.rows.push({ c, shown: '', flip: null, next: null });
    }
  }

  /** Bring the rows up to date. `seconds` is the planes' clock (0 while calm). */
  update(minute: number, seconds: number, calm: boolean): void {
    const dt = this.lastSeconds === null ? 0 : Math.max(0, seconds - this.lastSeconds);
    this.lastSeconds = seconds;
    const { cycle } = runwayStatus(seconds);
    if (cycle !== this.runwayCycle) {
      this.runwayCycle = cycle;
      // Its trip leaves a few minutes from now (rounded on the board).
      this.runwayTime = minuteOfDay(minute + 15);
    }
    const rows = boardRows(minute, seconds, this.runwayTime, BOARD_ROWS);
    boardNow.rows = rows;
    rows.forEach((r, i) => {
      const v = this.rows[i];
      if (!v) return;
      const sig = signature(r);
      if (v.shown === '') {
        drawRow(v.c, r);
        v.shown = sig;
        return;
      }
      if (sig !== v.shown && v.flip === null) {
        if (calm) {
          drawRow(v.c, r);
          v.shown = sig;
          return;
        }
        v.flip = 0;
        v.next = r;
      } else if (v.flip !== null) {
        v.next = r;
      }
      if (v.flip === null) return;
      // Turn over: shrink to a line, change, open again.
      const before = v.flip;
      v.flip = calm ? FLIP_SECONDS : v.flip + (dt > 0 ? dt : 1 / 30);
      const half = FLIP_SECONDS / 2;
      if (before < half && v.flip >= half && v.next) {
        drawRow(v.c, v.next);
        v.shown = signature(v.next);
      }
      if (v.flip >= FLIP_SECONDS) {
        v.flip = null;
        v.c.scale.y = 1;
        if (v.next && signature(v.next) !== v.shown) {
          drawRow(v.c, v.next);
          v.shown = signature(v.next);
        }
        v.next = null;
        return;
      }
      v.c.scale.y = Math.max(0.05, Math.abs(Math.cos((Math.PI * v.flip) / FLIP_SECONDS)));
    });
  }
}
