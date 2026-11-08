// Planes at the airport, as functions of time (seconds), so they are easy to test
// and pause. Room units: 900 wide, the runway's wheel line at y 392.

/** Seconds from one take-off to the next. */
export const RUNWAY_PERIOD = 36;
/** Where the plane waits on the runway (its wheels), facing left. */
export const RUNWAY_STAND = { x: 640, y: 392 };

export interface RunwayPlane {
  /** Centre of the wheels, in room units. */
  x: number;
  y: number;
  /** Nose up (radians) for a plane facing left. */
  tilt: number;
  /** Off-screen and away: not drawn. */
  away: boolean;
}

const ROLL_START = 7;
const LIFT_OFF = 13;
const GONE = 18;
const BACK = 24;
const TOUCH_DOWN = 29;
const STOPPED = 34;
const LIFT_OFF_X = 300;
/** Speed at lift-off (room units a second): the end of a steadily faster roll. */
const LIFT_OFF_SPEED = (2 * (RUNWAY_STAND.x - LIFT_OFF_X)) / (LIFT_OFF - ROLL_START);
const TOUCH_DOWN_X = 820;

/**
 * Where the runway plane is: waiting, rolling faster and faster to the left, lifting
 * off and climbing away; later it comes back from the right, lands and rolls to a
 * stop where it started.
 */
export function runwayPlaneAt(seconds: number): RunwayPlane {
  const t = ((seconds % RUNWAY_PERIOD) + RUNWAY_PERIOD) % RUNWAY_PERIOD;
  const { x: x0, y: y0 } = RUNWAY_STAND;
  if (t < ROLL_START || t >= STOPPED) return { x: x0, y: y0, tilt: 0, away: false };
  if (t < LIFT_OFF) {
    const u = (t - ROLL_START) / (LIFT_OFF - ROLL_START);
    return { x: x0 - (x0 - LIFT_OFF_X) * u * u, y: y0, tilt: 0, away: false };
  }
  if (t < GONE) {
    const d = t - LIFT_OFF;
    return {
      x: LIFT_OFF_X - LIFT_OFF_SPEED * d - 10 * d * d,
      y: y0 - 6 * d - 12 * d * d,
      tilt: Math.min(0.22, 0.09 * d),
      away: false,
    };
  }
  if (t < BACK) return { x: -400, y: 60, tilt: 0, away: true };
  if (t < TOUCH_DOWN) {
    const u = (t - BACK) / (TOUCH_DOWN - BACK);
    return {
      x: 1150 - (1150 - TOUCH_DOWN_X) * u,
      y: 150 + (y0 - 150) * (1 - (1 - u) * (1 - u)),
      tilt: 0.06 * u,
      away: false,
    };
  }
  const u = (t - TOUCH_DOWN) / (STOPPED - TOUCH_DOWN);
  return {
    x: TOUCH_DOWN_X - (TOUCH_DOWN_X - x0) * (1 - (1 - u) * (1 - u)),
    y: y0,
    tilt: 0,
    away: false,
  };
}

/** Seconds between planes passing the terminal's big window. */
export const WINDOW_PERIOD = 26;
const WINDOW_CROSSING = 11;

/**
 * A small plane passing behind the terminal's big window: 0–1 across the window
 * (beyond either end it is hidden behind the frame), or null between passes.
 */
export function windowPlaneAt(seconds: number): number | null {
  const t = ((seconds % WINDOW_PERIOD) + WINDOW_PERIOD) % WINDOW_PERIOD;
  if (t >= WINDOW_CROSSING) return null;
  return -0.2 + 1.4 * (t / WINDOW_CROSSING);
}
