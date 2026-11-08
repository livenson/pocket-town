import { describe, expect, it } from 'vitest';
import {
  nextThought,
  partOfDay,
  readTown,
  type Deck,
  type TownNow,
} from '../../src/app/critterMind';
import {
  critterThoughts,
  NAMED_WHEN,
  type Thought,
  type ThoughtWhen,
} from '../../src/content/critterThoughts';
import { critters, type CritterId } from '../../src/content/critters';
import { findBuilding, findRoom } from '../../src/content/rooms';
import { thingArt } from '../../src/design/thingArt';
import { en } from '../../src/i18n/strings.en';
import { et } from '../../src/i18n/strings.et';
import { lv } from '../../src/i18n/strings.lv';
import { createWorld } from '../../src/sim/world';

/** A small seeded random source, so the draws are the same every run. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_WHEN: ThoughtWhen[] = [
  'morning',
  'day',
  'evening',
  'night',
  'planeUp',
  'planeDown',
  ...NAMED_WHEN,
];
const everything: TownNow = Object.fromEntries(ALL_WHEN.map((w) => [w, 'Pim']));
const ids = critters.map((c) => c.id);

function draws(id: CritterId, n: number, now: (i: number) => TownNow, seed = 1): Thought[] {
  const rand = seeded(seed);
  let deck: Deck | undefined;
  const out: Thought[] = [];
  for (let i = 0; i < n; i++) {
    const pick = nextThought(id, deck, now(i), rand);
    deck = pick.deck;
    out.push(pick.thought);
  }
  return out;
}

describe('animal thoughts: content', () => {
  it('every animal has its own thoughts, with a mix of kinds', () => {
    for (const id of ids) {
      const list = critterThoughts[id];
      expect(list.length).toBeGreaterThanOrEqual(12);
      const kinds = new Set(list.map((t) => t.kind));
      for (const k of ['chat', 'fact', 'wish', 'trick', 'town'] as const)
        expect(kinds).toContain(k);
      expect(list.some((t) => t.answer)).toBe(true);
      // Plenty that need nothing from the town, so there is always something to say.
      expect(list.filter((t) => !t.when).length).toBeGreaterThanOrEqual(8);
    }
    const keys = Object.values(critterThoughts)
      .flat()
      .map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every thought has words in all three languages, names where it needs one', () => {
    const wrong: string[] = [];
    for (const [lang, dict] of [
      ['en', en],
      ['et', et],
      ['lv', lv],
    ] as const) {
      for (const t of Object.values(critterThoughts).flat()) {
        const words = dict.critters.thoughts[t.key];
        const named = t.when !== undefined && NAMED_WHEN.includes(t.when);
        const text = typeof words === 'function' ? words('Zuzu') : words;
        if (named !== (typeof words === 'function')) wrong.push(`${lang} ${t.key}: name`);
        if (named && !text.includes('Zuzu')) wrong.push(`${lang} ${t.key}: no name`);
        if (text.length < 6) wrong.push(`${lang} ${t.key}: empty`);
        if (t.answer && dict.critters.answers[t.answer.key].length < 3) {
          wrong.push(`${lang} ${t.key}: answer`);
        }
      }
      if (dict.critters.reveal.length < 3) wrong.push(`${lang} reveal`);
    }
    expect(wrong).toEqual([]);
  });

  it('no words without a thought, and every answer belongs to a riddle', () => {
    const keys = new Set<string>(
      Object.values(critterThoughts)
        .flat()
        .map((t) => t.key),
    );
    for (const dict of [en, et, lv]) {
      expect(new Set(Object.keys(dict.critters.thoughts))).toEqual(keys);
    }
    const answers = new Set(
      Object.values(critterThoughts)
        .flat()
        .flatMap((t) => (t.answer ? [t.answer.key as string] : [])),
    );
    expect(new Set(Object.keys(en.critters.answers))).toEqual(answers);
  });

  it('pictures exist and places are real buildings', () => {
    const wrong: string[] = [];
    for (const t of Object.values(critterThoughts).flat()) {
      const pics = [t.pic, ...(t.answer ? [t.answer.pic] : []), ...(t.props ?? [])];
      for (const p of pics) if (!thingArt[p]) wrong.push(`${t.key}: ${p}`);
      if (t.place && !findBuilding(t.place)) wrong.push(`${t.key}: ${t.place}`);
      if (t.trick === 'juggle' && !t.props?.length) wrong.push(`${t.key}: nothing to juggle`);
    }
    expect(wrong).toEqual([]);
  });
});

describe('animal thoughts: picking', () => {
  it('each animal only says its own thoughts', () => {
    for (const id of ids) {
      const own = new Set(critterThoughts[id].map((t) => t.key));
      for (const t of draws(id, 60, () => everything)) expect(own).toContain(t.key);
    }
  });

  it('goes through the whole shuffled deck before repeating any', () => {
    for (const id of ids) {
      const n = critterThoughts[id].length;
      const first = draws(id, n, () => everything).map((t) => t.key);
      expect(new Set(first).size).toBe(n);
    }
  });

  it('never says the same thought twice in a row, across reshuffles and changing towns', () => {
    const towns: TownNow[] = [{ day: '' }, { night: '', sleeper: 'Oki' }, everything, {}];
    for (const id of ids) {
      for (const seed of [1, 2, 3]) {
        const said = draws(id, 400, (i) => towns[Math.floor(i / 7) % towns.length] ?? {}, seed);
        const repeats = said.filter((t, i) => i > 0 && t.key === said[i - 1]?.key);
        expect(repeats).toEqual([]);
      }
    }
  });

  it('thoughts about the town come up only while they are true', () => {
    const now: TownNow = { day: '' };
    for (const id of ids) {
      const whens = new Set(draws(id, 200, () => now).map((t) => t.when ?? 'any'));
      whens.delete('any');
      expect([...whens].every((w) => w === 'day')).toBe(true);
    }
  });

  it('a true thought about the town does come up, with the right name', () => {
    const rand = seeded(7);
    let deck: Deck | undefined;
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const pick = nextThought('hedgehog', deck, { night: '', sleeper: 'Oki' }, rand);
      deck = pick.deck;
      if (pick.thought.when === 'sleeper') seen.push(pick.name);
    }
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((n) => n === 'Oki')).toBe(true);
  });
});

describe('reading the town', () => {
  it('knows the part of the day like the map dial', () => {
    expect(partOfDay(0)).toBe('morning'); // day 0 starts at 08:00
    expect(partOfDay(4 * 60)).toBe('day');
    expect(partOfDay(11 * 60)).toBe('evening');
    expect(partOfDay(15 * 60)).toBe('night');
  });

  it('finds who is sleeping, eating, walking and where', () => {
    const world = createWorld(1);
    world.minute = 15 * 60;
    const [a, b, c, d] = world.bots;
    if (!a || !b || !c || !d) throw new Error('starter cast');
    a.now = { activity: 'sleep', phase: 'doing', progress: 0.3, duration: 60, gains: {} };
    b.now = { activity: 'eat', phase: 'doing', progress: 0.3, duration: 20, gains: {} };
    c.travel = { from: 'home', to: 'park', t: 0.5 };
    const room = findRoom('hospital-main') ?? findBuilding('hospital')?.rooms[0];
    if (!room) throw new Error('hospital room');
    d.place = { buildingId: 'hospital', roomId: room.id, x: 400, y: 450 };
    const now = readTown(world, true, () => 0);
    expect(now.night).toBe('');
    expect(now.planeUp).toBe('');
    expect(now.planeDown).toBeUndefined();
    expect(now.sleeper).toBe(a.name);
    expect(now.eater).toBe(b.name);
    expect(now.walker).toBe(c.name);
    expect(now.atHospital).toBe(d.name);
    expect(now.atLibrary).toBeUndefined();
    expect(readTown(world, false, () => 0).planeDown).toBe('');
  });

  it("someone still on the way isn't sleeping yet", () => {
    const world = createWorld(1);
    const [a] = world.bots;
    if (!a) throw new Error('starter cast');
    a.now = { activity: 'sleep', phase: 'going', progress: 0, duration: 60, gains: {} };
    expect(readTown(world, null, () => 0).sleeper).toBeUndefined();
  });
});
