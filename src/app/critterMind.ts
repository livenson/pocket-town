// What a map animal thinks next. Pure: the town is read into a small snapshot
// (time of day, the plane, who is where), and each animal draws from its own
// shuffled deck of thoughts (src/content/critterThoughts.ts), never the same one
// twice in a row. Thoughts about the town come up only while they are true.
import { critterThoughts, type Thought, type ThoughtWhen } from '../content/critterThoughts';
import type { CritterId } from '../content/critters';
import { findBuilding, type BuildingKind } from '../content/rooms';
import { minuteOfDay } from '../sim/clock';
import type { World } from '../sim/types';

/** What is true in the town right now: each holding condition, with a name for "who" ones. */
export type TownNow = Partial<Record<ThoughtWhen, string>>;

/** How often a fitting thought about the town jumps the queue. */
export const TOWN_CHANCE = 0.45;

const AT: Partial<Record<BuildingKind, ThoughtWhen>> = {
  cafe: 'atCafe',
  park: 'atPark',
  library: 'atLibrary',
  musicHall: 'atMusic',
  hospital: 'atHospital',
  workshop: 'atWorkshop',
  shop: 'atShop',
  airport: 'atAirport',
};

/** Morning, day, evening or night, as the map's time dial shows it. */
export function partOfDay(minute: number): 'morning' | 'day' | 'evening' | 'night' {
  const h = minuteOfDay(minute) / 60;
  if (h >= 22 || h < 6) return 'night';
  if (h < 10) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

/**
 * Read the town. `plane` is whether the map's plane is in the air (null: not
 * known, e.g. with calm motion it stays parked and is not worth remarking on).
 * `rand` picks among several characters who fit, so the names vary.
 */
export function readTown(world: World, plane: boolean | null, rand: () => number): TownNow {
  const now: TownNow = { [partOfDay(world.minute)]: '' };
  if (plane === true) now.planeUp = '';
  if (plane === false) now.planeDown = '';
  const found = new Map<ThoughtWhen, string[]>();
  const add = (when: ThoughtWhen, name: string) =>
    found.set(when, [...(found.get(when) ?? []), name]);
  for (const bot of world.bots) {
    if (bot.travel) {
      add('walker', bot.name);
      continue;
    }
    const doing = bot.now?.phase === 'doing' ? bot.now.activity : null;
    if (doing === 'sleep' || doing === 'nap') add('sleeper', bot.name);
    if (doing === 'eat') add('eater', bot.name);
    const kind = findBuilding(bot.place.buildingId)?.kind;
    const at = kind ? AT[kind] : undefined;
    if (at) add(at, bot.name);
  }
  for (const [when, names] of found) {
    now[when] = names[Math.floor(rand() * names.length)] ?? names[0] ?? '';
  }
  return now;
}

/** An animal's place in its deck: the keys still to come, and the last one said. */
export interface Deck {
  left: string[];
  last: string | null;
}

export interface Pick {
  thought: Thought;
  /** The character a "who" thought is about. */
  name: string;
  deck: Deck;
}

function shuffled<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

const fits = (t: Thought, now: TownNow) => !t.when || now[t.when] !== undefined;

/**
 * The animal's next thought. Draws from what is left of its shuffled deck,
 * skipping thoughts that don't fit the town right now (they wait for later) and
 * the one just said; a fitting thought about the town sometimes comes first.
 * When nothing in the deck fits, a fresh shuffle starts.
 */
export function nextThought(
  id: CritterId,
  deck: Deck | undefined,
  now: TownNow,
  rand: () => number,
): Pick {
  const all = critterThoughts[id];
  const byKey = new Map(all.map((t) => [t.key as string, t]));
  const last = deck?.last ?? null;
  const ok = (key: string) => {
    const t = byKey.get(key);
    return t !== undefined && key !== last && fits(t, now);
  };
  const choose = (left: string[]): number => {
    if (rand() < TOWN_CHANCE) {
      const i = left.findIndex((k) => ok(k) && byKey.get(k)?.when !== undefined);
      if (i >= 0) return i;
    }
    return left.findIndex(ok);
  };
  let left =
    deck?.left ??
    shuffled(
      all.map((t) => t.key),
      rand,
    );
  let i = choose(left);
  if (i < 0) {
    left = shuffled(
      all.map((t) => t.key),
      rand,
    );
    i = choose(left);
  }
  // Only the last thought fits (never with real decks): say it again.
  const key = i >= 0 ? left[i] : last;
  const thought = (key !== null && key !== undefined ? byKey.get(key) : undefined) ?? all[0];
  if (!thought) throw new Error(`no thoughts for ${id}`);
  return {
    thought,
    name: thought.when ? (now[thought.when] ?? '') : '',
    deck: { left: left.filter((_, j) => j !== i), last: thought.key },
  };
}
