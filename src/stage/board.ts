// The airport's departure board (owner's request: "let the board show flight
// statuses"), as pure functions of time so it is easy to test. No Pixi here.
//
// The top row is the plane outside on the apron: it boards while the plane waits,
// reads "departed" once it rolls away and "landed" when it comes back, in step with
// the runway animation (stage/planes.ts). The other rows are a timetable in game
// minutes: each flight is on time (or now and then delayed), boards for a while,
// then departs; some are arrivals that land. Nothing is ever cancelled.
import { minuteOfDay } from '../sim/clock';
import { RUNWAY_PERIOD } from './planes';

export type FlightStatus = 'boarding' | 'onTime' | 'delayed' | 'departed' | 'landed';
/** Where a flight goes: pictures, never flags of real countries. */
export type Destination = 'beach' | 'snow' | 'castle' | 'island' | 'city';
export const DESTINATIONS: readonly Destination[] = ['beach', 'snow', 'castle', 'island', 'city'];

export interface BoardRow {
  /** Stays the same while the row shows the same flight (for the flip). */
  flight: string;
  destination: Destination;
  /** Minute of the day it leaves or lands (0–1439). */
  time: number;
  status: FlightStatus;
}

/** Game minutes between one timetable flight and the next. */
export const FLIGHT_EVERY = 50;
/** Boarding starts this long before a flight leaves. */
export const BOARDING_MINUTES = 25;
/** A delayed flight leaves this much later. */
export const DELAY_MINUTES = 20;
/** A flight stays on the board this long after leaving or landing. */
export const SHOWN_AFTER = 20;

// The runway plane's timetable (seconds into its cycle; see stage/planes.ts).
const ROLL_START = 7;
const BACK = 24;

/** The plane outside: boarding while it waits, departed once it rolls, landed once back. */
export function runwayStatus(seconds: number): { cycle: number; status: FlightStatus } {
  const cycle = Math.floor(seconds / RUNWAY_PERIOD);
  const t = seconds - cycle * RUNWAY_PERIOD;
  const status: FlightStatus = t < ROLL_START ? 'boarding' : t < BACK ? 'departed' : 'landed';
  return { cycle, status };
}

/** A small whole-number hash (the same on every machine). */
function mix(n: number): number {
  let h = Math.imul(n ^ 0x5bd1e995, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  return (h ^ (h >>> 13)) >>> 0;
}

interface Flight {
  n: number;
  /** Absolute game minute it is due. */
  due: number;
  arrival: boolean;
  delayed: boolean;
}

function flight(n: number): Flight {
  const h = mix(n);
  return { n, due: n * FLIGHT_EVERY + 30, arrival: n % 3 === 1, delayed: h % 5 === 0 };
}

function statusAt(f: Flight, minute: number): FlightStatus {
  const go = f.due + (f.delayed ? DELAY_MINUTES : 0);
  if (minute >= go) return f.arrival ? 'landed' : 'departed';
  if (!f.arrival && minute >= go - BOARDING_MINUTES) return 'boarding';
  return f.delayed ? 'delayed' : 'onTime';
}

/** The timetable rows at a game minute: the next `count` flights still on the board. */
export function timetable(minute: number, count: number): BoardRow[] {
  const rows: BoardRow[] = [];
  // Start a little back: flights stay on the board a while after they go.
  let n = Math.max(0, Math.floor((minute - DELAY_MINUTES - SHOWN_AFTER - 30) / FLIGHT_EVERY));
  while (rows.length < count) {
    const f = flight(n++);
    const go = f.due + (f.delayed ? DELAY_MINUTES : 0);
    if (minute >= go + SHOWN_AFTER) continue;
    rows.push({
      flight: `t${f.n}`,
      destination: DESTINATIONS[mix(f.n + 7) % DESTINATIONS.length] ?? 'beach',
      time: minuteOfDay(f.due),
      status: statusAt(f, minute),
    });
  }
  return rows;
}

/**
 * Everything on the board: the plane outside first, then the timetable. The plane
 * outside shows the time its current trip began (`runwayTime`, kept by the view).
 */
export function boardRows(
  minute: number,
  planeSeconds: number,
  runwayTime: number,
  count: number,
): BoardRow[] {
  const { cycle, status } = runwayStatus(planeSeconds);
  return [
    {
      flight: `r${cycle}`,
      destination: DESTINATIONS[cycle % DESTINATIONS.length] ?? 'beach',
      time: runwayTime,
      status,
    },
    ...timetable(minute, count - 1),
  ];
}

/** What the board shows right now (kept by the stage; read for the spoken label). */
export const boardNow: { rows: BoardRow[] } = { rows: [] };

/** "08:35": a time as clock digits, rounded down to five minutes. */
export function clockDigits(minuteOfTheDay: number): string {
  const m = Math.floor(minuteOfTheDay / 5) * 5;
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
