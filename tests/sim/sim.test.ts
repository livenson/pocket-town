import { describe, expect, it } from 'vitest';
import { tuning } from '../../src/content/tuning';
import { apply } from '../../src/sim/commands';
import { plan, urgency } from '../../src/sim/planner';
import { run, step } from '../../src/sim/step';
import type { Bot, World } from '../../src/sim/types';
import { createWorld, getBot } from '../../src/sim/world';

const bot = (w: World, id: string): Bot => {
  const b = getBot(w, id);
  if (!b) throw new Error(id);
  return b;
};

/** Ticks for a number of game minutes. */
const minutes = (m: number) => Math.round(m / tuning.gameMinutesPerTick);

/** How much Tavi's hunger has dropped from its starting 75. */
const drop = (w: World) => 75 - bot(w, 'tavi').needs.hunger;

describe('needs', () => {
  it('decay at the documented rates per game hour', () => {
    const w = createWorld(1);
    for (const b of w.bots) b.mode = 'puppet'; // no autonomy: nothing restores needs
    const oki = bot(w, 'oki'); // sleepy, gardener, shy
    const before = { ...oki.needs };
    run(w, minutes(60));
    expect(before.hunger - oki.needs.hunger).toBeCloseTo(6, 1);
    expect(before.fun - oki.needs.fun).toBeCloseTo(5, 1);
    expect(before.energy - oki.needs.energy).toBeCloseTo(4 * 1.3, 1); // sleepy ×1.3
    expect(before.social - oki.needs.social).toBeCloseTo(3 * 0.6, 1); // shy ×0.6
  });

  it('urgency grows sharply as a need runs low', () => {
    expect(urgency(100)).toBe(0);
    expect(urgency(50)).toBeCloseTo(0.25);
    expect(urgency(0)).toBe(1);
  });

  it('paused bot energy: bots idle in place and needs hold still', () => {
    const w = createWorld(1);
    w.energy = 'paused';
    const places = JSON.stringify(w.bots.map((b) => [b.place, b.needs]));
    run(w, minutes(120));
    expect(JSON.stringify(w.bots.map((b) => [b.place, b.needs]))).toBe(places);
  });

  it('calm bot energy halves the decay', () => {
    const lively = createWorld(1);
    const calm = createWorld(1);
    lively.energy = 'lively';
    calm.energy = 'calm';
    for (const w of [lively, calm]) for (const b of w.bots) b.mode = 'puppet';
    run(lively, minutes(60));
    run(calm, minutes(60));
    expect(drop(calm)).toBeCloseTo(drop(lively) / 2, 1);
  });
});

describe('choosing', () => {
  it('trait multipliers change choices: a snacky bot eats more often than a musical one', () => {
    let snackyEats = 0;
    let musicalEats = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = createWorld(seed);
      const a = bot(w, 'moku');
      const b = bot(w, 'pim');
      for (const x of [a, b]) {
        x.needs = { hunger: 55, energy: 90, fun: 55, social: 90 };
        x.place = { buildingId: 'home', roomId: 'home-living', x: 450, y: 450 };
      }
      a.traits = ['snacky', 'shy', 'gardener'];
      b.traits = ['musical', 'shy', 'gardener'];
      if (plan(w, a).best?.ad.activity === 'eat') snackyEats++;
      if (plan(w, b).best?.ad.activity === 'eat') musicalEats++;
    }
    expect(snackyEats).toBeGreaterThan(musicalEats);
  });

  it('a hungry bot walks to food and eats', () => {
    const w = createWorld(7);
    const moku = bot(w, 'moku');
    moku.needs = { hunger: 10, energy: 90, fun: 90, social: 90 };
    step(w);
    expect(moku.now?.activity).toBe('eat');
    const start = { ...moku.place };
    run(w, minutes(20));
    expect(moku.place).not.toEqual(start);
    expect(moku.now?.phase).toBe('doing');
    const hungerBefore = moku.needs.hunger;
    run(w, minutes(10));
    expect(moku.needs.hunger).toBeGreaterThan(hungerBefore);
  });

  it('exposes now (with progress) and next for the UI', () => {
    const w = createWorld(3);
    run(w, minutes(30));
    const progress = w.bots.flatMap((b) => (b.now ? [b.now.progress] : []));
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.every((p) => p >= 0 && p <= 1)).toBe(true);
    expect(w.bots.some((b) => b.next !== null)).toBe(true);
  });

  it('is deterministic for a seed', () => {
    const a = createWorld(99);
    const b = createWorld(99);
    run(a, 3000);
    run(b, 3000);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('the child steers', () => {
  it('a nudge overrides the next choice', () => {
    const w = createWorld(5);
    const pim = bot(w, 'pim');
    run(w, minutes(10));
    expect(pim.now?.activity).not.toBe('read');
    apply(w, { type: 'nudge', botId: 'pim', activity: 'read' });
    run(w, minutes(15));
    expect(pim.now?.activity).toBe('read');
  });

  it('a nudge for something out of reach shows a wish cloud', () => {
    const w = createWorld(5);
    const pim = bot(w, 'pim');
    apply(w, { type: 'nudge', botId: 'pim', activity: 'tidy' }); // nothing left out to tidy
    run(w, 3);
    expect(pim.now?.activity).not.toBe('tidy');
    apply(w, { type: 'nudge', botId: 'pim', activity: 'read' });
    run(w, minutes(10));
    expect(pim.now?.activity).toBe('read');
  });

  it('frozen bots do not move and their needs stop changing', () => {
    const w = createWorld(11);
    run(w, minutes(5));
    apply(w, { type: 'freeze', botId: 'tavi', on: true });
    const tavi = bot(w, 'tavi');
    const snapshot = JSON.stringify({ place: tavi.place, needs: tavi.needs, now: tavi.now });
    run(w, 1000);
    expect(JSON.stringify({ place: tavi.place, needs: tavi.needs, now: tavi.now })).toBe(snapshot);
    apply(w, { type: 'freeze', botId: 'tavi', on: false });
    expect(tavi.mode).toBe('auto');
  });

  it('giving food makes the bot eat at once, happily; granting a wish is extra happy', () => {
    const w = createWorld(2);
    const lumo = bot(w, 'lumo');
    lumo.wish = 'cake';
    apply(w, { type: 'give', botId: 'lumo', kind: 'cake' });
    expect(lumo.now?.activity).toBe('eat');
    expect(lumo.wish).toBeNull();
    expect(w.events.some((e) => e.type === 'wishGranted' && e.botId === 'lumo')).toBe(true);
  });

  it('call here walks the bot to the spot and it waits', () => {
    const w = createWorld(2);
    apply(w, {
      type: 'call',
      botId: 'oki',
      place: { buildingId: 'home', roomId: 'home-living', x: 700, y: 480 },
    });
    run(w, minutes(25));
    const oki = bot(w, 'oki');
    expect(oki.place.roomId).toBe('home-living');
    expect(oki.place.x).toBeCloseTo(700, 0);
    expect(oki.now?.activity).toBe('wait');
  });

  it('a puppet bot only moves where the child says', () => {
    const w = createWorld(8);
    apply(w, { type: 'control', botId: 'moku', on: true });
    const moku = bot(w, 'moku');
    const at = { ...moku.place };
    run(w, minutes(60));
    expect(moku.place).toEqual(at);
    apply(w, { type: 'puppetMove', botId: 'moku', place: { ...at, x: 600 } });
    run(w, minutes(20));
    expect(moku.place.x).toBeCloseTo(600, 0);
    expect(moku.now).toBeNull();
  });

  it('send home brings a visitor back', () => {
    const w = createWorld(8);
    const lumo = bot(w, 'lumo');
    apply(w, { type: 'sendHome', botId: 'lumo' });
    run(w, minutes(10));
    expect(lumo.place.buildingId).toBe('neighbour');
  });
});

describe("bots never undo the child's story", () => {
  it('child-placed objects are never moved, removed or changed (10,000 ticks)', () => {
    for (const seed of [1, 2, 3]) {
      const w = createWorld(seed);
      apply(w, {
        type: 'placeObject',
        kind: 'cake',
        place: { buildingId: 'home', roomId: 'home-living', x: 300, y: 500 },
      });
      apply(w, {
        type: 'placeObject',
        kind: 'ball',
        place: { buildingId: 'home', roomId: 'home-bedroom', x: 600, y: 480 },
      });
      apply(w, {
        type: 'placeObject',
        kind: 'storybook',
        place: { buildingId: 'neighbour', roomId: 'neighbour-main', x: 500, y: 470 },
      });
      // A gift ball gets dropped on the floor by a bot: tidy bots may put that one away.
      apply(w, { type: 'give', botId: 'moku', kind: 'ball' });
      const childObjects = JSON.stringify(w.objects.filter((o) => o.placedBy === 'child'));
      for (let i = 0; i < 10_000; i++) {
        step(w);
        expect(JSON.stringify(w.objects.filter((o) => o.placedBy === 'child'))).toBe(childObjects);
      }
    }
  });

  it('bots use child-placed things (a plate that never empties)', () => {
    const w = createWorld(4);
    apply(w, {
      type: 'placeObject',
      kind: 'cake',
      place: { buildingId: 'home', roomId: 'home-living', x: 700, y: 500 },
    });
    const plateUsers = new Set<string>();
    for (let i = 0; i < 12_000; i++) {
      step(w);
      for (const b of w.bots)
        if (b.now?.targetId === 'object:o1' && b.now.phase === 'doing') plateUsers.add(b.id);
    }
    expect(plateUsers.size).toBeGreaterThan(0);
    expect(w.objects.find((o) => o.id === 'o1')).toBeTruthy();
  });

  it('visitors leave within two game hours of arriving', () => {
    const w = createWorld(21);
    const visitStart: Record<string, number> = {};
    let longestVisit = 0;
    let visits = 0;
    for (let i = 0; i < 20_000; i++) {
      step(w);
      for (const b of w.bots) {
        const visiting = b.now?.activity === 'visit' && b.now.phase === 'doing';
        if (visiting && visitStart[b.id] === undefined) visits++;
        if (visiting) visitStart[b.id] ??= w.minute;
        else delete visitStart[b.id];
        longestVisit = Math.max(longestVisit, w.minute - (visitStart[b.id] ?? w.minute));
      }
    }
    expect(visits).toBeGreaterThan(0);
    expect(longestVisit).toBeLessThanOrEqual(tuning.visitMaxMinutes + 1);
  });
});

describe('a long run', () => {
  it('nobody gets stuck: everyone keeps doing new things over three game days', () => {
    const w = createWorld(123);
    const ticks = minutes(3 * 24 * 60);
    const lastChange: Record<string, number> = {};
    const key: Record<string, string> = {};
    const kinds: Record<string, Set<string>> = {};
    let worstOverrun = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < ticks; i++) {
      step(w);
      for (const b of w.bots) {
        const k = `${b.now?.activity}:${b.now?.targetId}:${b.travel ? 'T' : ''}:${b.route.length}`;
        if (key[b.id] !== k) {
          key[b.id] = k;
          lastChange[b.id] = w.minute;
        }
        // A night's sleep runs 22:00–07:00; anything else changes within 5 hours.
        const limit = b.now?.activity === 'sleep' ? 720 : 300;
        worstOverrun = Math.max(worstOverrun, w.minute - (lastChange[b.id] ?? 0) - limit);
        if (b.now) (kinds[b.id] ??= new Set()).add(b.now.activity);
      }
    }
    expect(worstOverrun).toBeLessThanOrEqual(0.01);
    const summary = w.bots.map((b) => ({
      id: b.id,
      ate: kinds[b.id]?.has('eat'),
      slept: kinds[b.id]?.has('sleep'),
      variety: (kinds[b.id]?.size ?? 0) >= 5,
      lowestNeed: Math.min(...Object.values(b.needs)) > 5,
    }));
    expect(summary).toEqual(
      w.bots.map((b) => ({ id: b.id, ate: true, slept: true, variety: true, lowestNeed: true })),
    );
  });
});

describe('night', () => {
  it('bots go to bed at night and stay asleep until morning', () => {
    const w = createWorld(17);
    // Jump to 21:30; by 01:00 everyone at home should be asleep in bed.
    w.minute = 21.5 * 60 - 8 * 60;
    run(w, minutes(3.5 * 60));
    const sleeping = w.bots.filter((b) => b.now?.activity === 'sleep');
    expect(sleeping.length).toBeGreaterThanOrEqual(w.bots.length - 1);
    for (const b of sleeping) expect(b.place.buildingId).toBe(b.homeId);
    // Still asleep at 05:00, with no waking up and going back to bed overnight.
    const seq = w.nextEventSeq;
    run(w, minutes(4 * 60));
    expect(w.bots.filter((b) => b.now?.activity === 'sleep').length).toBeGreaterThanOrEqual(
      sleeping.length,
    );
    expect(w.events.filter((e) => e.seq >= seq && e.type === 'start')).toEqual([]);
  });
});
