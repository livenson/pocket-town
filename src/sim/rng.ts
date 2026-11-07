// Seeded random numbers (mulberry32). The state is a single number kept in the
// world, so a saved world replays exactly.

export interface RngState {
  s: number;
}

export function nextRandom(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) | 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomInt(r: RngState, min: number, maxInclusive: number): number {
  return min + Math.floor(nextRandom(r) * (maxInclusive - min + 1));
}

export function pick<T>(r: RngState, items: readonly T[]): T | undefined {
  return items.length === 0 ? undefined : items[Math.floor(nextRandom(r) * items.length)];
}
