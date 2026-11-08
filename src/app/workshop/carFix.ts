// The car-fixing game in the garage (owner's request: "when clicking on a car, I
// want to get a minigame to start fixing it"). Pure state, no React: a few broken
// spots, each mended by one tool. The wrong tool just goes "boing"; there is no
// timer, no score and nothing to lose.

export type CarSpot = 'tyre' | 'bolt' | 'dent' | 'window' | 'fuel';
export type CarTool = 'wheel' | 'wrench' | 'hammer' | 'sponge' | 'fuelPump';

export const CAR_SPOTS: readonly CarSpot[] = ['tyre', 'bolt', 'dent', 'window', 'fuel'];
/** The tool tray, in the order it is shown. */
export const CAR_TOOLS: readonly CarTool[] = ['wrench', 'hammer', 'wheel', 'sponge', 'fuelPump'];

/** Which tool mends which spot. */
export const toolFor: Record<CarSpot, CarTool> = {
  tyre: 'wheel',
  bolt: 'wrench',
  dent: 'hammer',
  window: 'sponge',
  fuel: 'fuelPump',
};

/** Each tool's picture (src/design/thingArt.ts). */
export const toolArt: Record<CarTool, string> = {
  wheel: 'wheel',
  wrench: 'wrench',
  hammer: 'hammer',
  sponge: 'sponge',
  fuelPump: 'fuel-pump',
};

/** How many spots break at once: enough to play, short enough for a six-year-old. */
export const BROKEN_SPOTS = 3;

export interface CarFixState {
  /** What is broken this time, in the order shown. */
  broken: CarSpot[];
  fixed: CarSpot[];
}

export type ToolResult = 'fixed' | 'wrong' | 'already';

/** A small whole-number hash (the same on every machine). */
function mix(n: number): number {
  let h = Math.imul((n | 0) ^ 0x27d4eb2d, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  return (h ^ (h >>> 13)) >>> 0;
}

/** What is broken, picked from a seed (the game day): a different mix most days. */
export function breakdown(seed: number, count = BROKEN_SPOTS): CarFixState {
  const order = CAR_SPOTS.map((spot, i) => ({ spot, key: mix(seed * 31 + i) }));
  order.sort((a, b) => a.key - b.key);
  const chosen = new Set(
    order.slice(0, Math.max(1, Math.min(count, CAR_SPOTS.length))).map((o) => o.spot),
  );
  // Shown in the car's own order, front to back.
  return { broken: CAR_SPOTS.filter((s) => chosen.has(s)), fixed: [] };
}

/** Use a tool on a spot: it mends it if it is the right one. */
export function applyTool(
  state: CarFixState,
  spot: CarSpot,
  tool: CarTool,
): { state: CarFixState; result: ToolResult } {
  if (!state.broken.includes(spot) || state.fixed.includes(spot))
    return { state, result: 'already' };
  if (toolFor[spot] !== tool) return { state, result: 'wrong' };
  return { state: { ...state, fixed: [...state.fixed, spot] }, result: 'fixed' };
}

export function allFixed(state: CarFixState): boolean {
  return state.broken.every((s) => state.fixed.includes(s));
}

/** Where each spot sits on the car picture (fractions of its width and height). */
export const spotAt: Record<CarSpot, { x: number; y: number }> = {
  tyre: { x: 0.735, y: 0.8 },
  bolt: { x: 0.105, y: 0.6 },
  dent: { x: 0.5, y: 0.6 },
  window: { x: 0.4, y: 0.27 },
  fuel: { x: 0.885, y: 0.5 },
};
