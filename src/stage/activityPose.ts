// How a character holds itself while doing something: the arms' gesture for each
// activity, and sitting on seats or lying in beds when the activity uses one.
// Pure (no Pixi): the stage view asks it where to put the figure.
import type { ActivityId } from '../content/activities';
import { furnitureKinds, type FurnitureInstance, type FurnitureKind } from '../content/furniture';
import type { Gesture, Stance } from './peg/rig';

/** The gesture that shows what an activity is, without words. */
export function gestureFor(activity: ActivityId): Gesture {
  switch (activity) {
    case 'eat':
      return 'eat';
    case 'read':
      return 'read';
    case 'chat':
      return 'talk';
    case 'garden':
      return 'water';
    case 'tidy':
      return 'sweep';
    case 'tinker':
      return 'hammer';
    case 'shop':
      return 'reach';
    case 'planes':
      return 'point';
    case 'visit':
      return 'wave';
    default:
      return 'none';
  }
}

/** Seats: the top of the cushion (local y) and where along it one can sit. */
interface SeatSpec {
  y: number;
  x0: number;
  x1: number;
  /** Separate seats (a row of chairs): their middles. */
  seats?: number[];
}

/** Beds: where the head rests (local), one pillow per sleeper. */
interface BedSpec {
  pillows: { x: number; y: number }[];
}

const seatRow = [47, 129, 211];

export const SEATS: Partial<Record<string, SeatSpec>> = {
  sofa: { y: 58, x0: 40, x1: 238 },
  armchair: { y: 60, x0: 30, x1: 120 },
  bench: { y: 18, x0: 4, x1: 156 },
  beanbag: { y: 40, x0: 30, x1: 90 },
  waitingChairs: { y: 48, x0: 10, x1: 250, seats: seatRow },
  gateSeats: { y: 48, x0: 10, x1: 250, seats: seatRow },
  examBed: { y: 24, x0: 90, x1: 220 },
};

export const BEDS: Partial<Record<string, BedSpec>> = {
  bed: {
    pillows: [
      { x: 52, y: 54 },
      { x: 60, y: 70 },
    ],
  },
  bunkBed: {
    pillows: [
      { x: 48, y: 170 },
      { x: 48, y: 54 },
    ],
  },
  cot: { pillows: [{ x: 44, y: 58 }] },
  hospitalBed: { pillows: [{ x: 52, y: 56 }] },
};

export interface Placement {
  stance: Stance;
  /**
   * Room point the figure is placed by: for sitting, the hips (pelvis joint); for
   * lying, where the head rests.
   */
  at: { x: number; y: number };
  /** Lying: which way the head points (the pillow's side). */
  facing?: 1 | -1;
  /** Drawn in front of the piece (its depth line plus a little). */
  z: number;
}

/**
 * Sitting or lying on a piece of furniture, or null to stand in front of it.
 * `slot` is this character's place among those using the piece (0, 1, …);
 * `nearX` is where it stands, to pick the nearest seat; `size` is its height.
 */
export function placementOn(
  f: FurnitureInstance,
  activity: ActivityId,
  slot: number,
  nearX: number,
  size: number,
): Placement | null {
  const kind: FurnitureKind = furnitureKinds[f.kind];
  const sc = f.scale ?? 1;
  const w = kind.w * sc;
  const z = f.y + (kind.footY ?? kind.h) * sc + 1;
  // Local x to room x, for pieces turned the other way too.
  const rx = (x: number) => (f.flip ? f.x + w - x * sc : f.x + x * sc);
  const bed = BEDS[f.kind];
  if (bed && (activity === 'sleep' || activity === 'nap')) {
    const p = bed.pillows[slot % bed.pillows.length] ?? bed.pillows[0];
    if (!p) return null;
    return {
      stance: 'lie',
      at: { x: rx(p.x), y: f.y + p.y * sc },
      facing: f.flip ? -1 : 1,
      z,
    };
  }
  const seat = SEATS[f.kind];
  if (!seat) return null;
  let x: number;
  if (seat.seats) {
    const xs = seat.seats.map(rx);
    x = xs.reduce((best, c) => (Math.abs(c - nearX) < Math.abs(best - nearX) ? c : best));
  } else {
    const lo = Math.min(rx(seat.x0), rx(seat.x1)) + size * 0.12;
    const hi = Math.max(rx(seat.x0), rx(seat.x1)) - size * 0.12;
    x = lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, nearX));
  }
  // The hips sink a little into the cushion.
  return { stance: 'sit', at: { x, y: f.y + seat.y * sc - size * 0.03 }, z };
}
