// The plane on the world map: it waits by the airport, takes off along the runway,
// flies a loop over the town, lands and turns round to wait again. Pure: the
// position is a function of time, so it can be tested and paused.

/** Seconds for one whole trip. */
export const MAP_PLANE_PERIOD = 48;

/** Whether the plane on screen is in the air right now (the map's animals remark on it). */
export const mapPlaneNow = { flying: false };

/** Where the plane waits: the east end of the runway (map fractions, as buildings). */
export const MAP_PLANE_STAND = { x: 0.93, y: 0.37 };

/** Keyframes: time (s), position (0–1 across and down the map), height (0–1). */
const KEYS: readonly (readonly [number, number, number, number])[] = [
  [0, 0.93, 0.37, 0],
  [8, 0.93, 0.37, 0],
  [10, 0.89, 0.37, 0],
  [14, 0.68, 0.37, 0],
  [16, 0.58, 0.31, 0.6],
  [19, 0.42, 0.13, 1],
  [23, 0.14, 0.08, 1],
  [27, 0.04, 0.42, 1],
  [31, 0.2, 0.74, 1],
  [35, 0.4, 0.64, 1],
  [38, 0.53, 0.44, 0.5],
  [40, 0.64, 0.37, 0],
  [44, 0.9, 0.37, 0],
  [45, 0.93, 0.37, 0],
  [48, 0.93, 0.37, 0],
];
/** Turning round on the stand after landing (s). */
const TURN_FROM = 45;

export interface MapPlaneState {
  x: number;
  y: number;
  /** 0 on the ground, 1 cruising. */
  height: number;
  /** Direction the nose points, in radians on screen (0 = east, π/2 = south). */
  heading: number;
}

const catmull = (p0: number, p1: number, p2: number, p3: number, u: number): number =>
  0.5 *
  (2 * p1 +
    (-p0 + p2) * u +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u +
    (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

function key(i: number): readonly [number, number, number, number] {
  const k = KEYS[Math.max(0, Math.min(KEYS.length - 1, i))];
  return k ?? [0, MAP_PLANE_STAND.x, MAP_PLANE_STAND.y, 0];
}

function positionAt(t: number): { x: number; y: number; height: number } {
  let i = 0;
  while (i < KEYS.length - 2 && key(i + 1)[0] <= t) i++;
  const a = key(i);
  const b = key(i + 1);
  const u = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
  const p0 = key(i - 1);
  const p3 = key(i + 2);
  // On the ground: straight along the runway (a curve would wander off it).
  if (a[3] === 0 && b[3] === 0)
    return { x: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u, height: 0 };
  return {
    x: catmull(p0[1], a[1], b[1], p3[1], u),
    y: catmull(p0[2], a[2], b[2], p3[2], u),
    height: a[3] + (b[3] - a[3]) * u,
  };
}

/**
 * Where the plane is `seconds` into its loop. `aspect` is the map's width over its
 * height, so the nose follows the path as it looks on screen.
 */
export function mapPlaneAt(seconds: number, aspect = 1.5): MapPlaneState {
  const t = ((seconds % MAP_PLANE_PERIOD) + MAP_PLANE_PERIOD) % MAP_PLANE_PERIOD;
  const here = positionAt(t);
  if (t >= TURN_FROM) {
    // Turn round through north to face west again, ready for the next take-off.
    const u = (t - TURN_FROM) / (MAP_PLANE_PERIOD - TURN_FROM);
    return { ...here, heading: -Math.PI * u };
  }
  const ahead = positionAt(t + 0.2);
  const dx = (ahead.x - here.x) * aspect;
  const dy = ahead.y - here.y;
  const heading = Math.hypot(dx, dy) < 1e-6 ? Math.PI : Math.atan2(dy, dx);
  return { ...here, heading };
}
