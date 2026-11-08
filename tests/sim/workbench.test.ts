import { set } from 'idb-keyval';
import { describe, expect, it } from 'vitest';
import {
  benchHint,
  craftMaterials,
  craftTools,
  madeAtBench,
  recipeFor,
  recipes,
} from '../../src/content/crafting';
import { giveEffects, objectKinds, placedOffers } from '../../src/content/objects';
import { SAVE_SLOTS, loadSave, resetSaveState } from '../../src/persist/save';
import { History } from '../../src/sim/history';
import { run } from '../../src/sim/step';
import type { World } from '../../src/sim/types';
import {
  CAR_SHINY_MINUTES,
  benchSlotX,
  benchWouldMake,
  botTinkered,
  carIsShiny,
  onBench,
  type BenchPut,
} from '../../src/sim/workbench';
import { createWorld, getBot } from '../../src/sim/world';

const ROOM = 'workshop-main';
const BENCH = 'workbench-1';
const put = (kind: string, x = 300, more: Partial<BenchPut> = {}): BenchPut => ({
  type: 'benchPut',
  roomId: ROOM,
  benchId: BENCH,
  kind,
  x,
  ...more,
});
const kindsOnBench = (w: World) => onBench(w, ROOM, BENCH).map((o) => o.kind);

describe('recipes', () => {
  it('each recipe makes a known thing from tools and materials, and can be reached', () => {
    const known = new Set(objectKinds.map((o) => o.id));
    for (const r of recipes) {
      expect(known.has(r.makes)).toBe(true);
      expect(giveEffects[r.makes]).toBeTruthy();
      expect(placedOffers[r.makes]).toBeTruthy();
      // Its own pieces make exactly it (no earlier recipe gets there first).
      expect(recipeFor([r.tool, ...r.materials])?.makes).toBe(r.makes);
    }
    for (const k of [...craftTools, ...craftMaterials, ...madeAtBench])
      expect(known.has(k)).toBe(true);
  });

  it('needs a tool and every material', () => {
    expect(recipeFor(['planks'])).toBeNull();
    expect(recipeFor(['hammer'])).toBeNull();
    expect(recipeFor(['hammer', 'planks'])?.makes).toBe('birdhouse');
    expect(recipeFor(['screwdriver', 'magnet'])).toBeNull();
    expect(recipeFor(['nutAndBolt', 'screwdriver', 'magnet'])?.makes).toBe('robot');
    expect(recipeFor(['banana', 'wrench', 'wheel'])?.makes).toBe('toyCar');
  });

  it('hints at what is missing, never for a bench of other things', () => {
    expect(benchHint([])).toBeNull();
    expect(benchHint(['banana'])).toBeNull();
    expect(benchHint(['hammer'])).toEqual({ makes: 'birdhouse', missing: ['planks'] });
    expect(benchHint(['magnet'])).toEqual({
      makes: 'robot',
      missing: ['screwdriver', 'nutAndBolt'],
    });
    expect(benchHint(['screwdriver', 'magnet'])).toEqual({
      makes: 'robot',
      missing: ['nutAndBolt'],
    });
    expect(benchHint(['hammer', 'planks'])).toBeNull();
  });
});

describe('the workbench', () => {
  it('keeps things on the bench until they make something', () => {
    const w = createWorld(1);
    const h = new History();
    expect(h.do(w, put('hammer', 220))).toBe(true);
    expect(kindsOnBench(w)).toEqual(['hammer']);
    expect(benchWouldMake(w, put('planks'))?.makes).toBe('birdhouse');
    expect(benchWouldMake(w, put('gear'))).toBeNull();
  });

  it('makes a thing: the material is used up, the tool stays, the result is on the bench', () => {
    const w = createWorld(1);
    const h = new History();
    h.do(w, put('hammer', 220));
    h.do(w, put('planks', 330));
    expect(kindsOnBench(w).toSorted()).toEqual(['birdhouse', 'hammer']);
    const made = w.objects.find((o) => o.kind === 'birdhouse');
    expect(made?.placedBy).toBe('child');
    expect(made?.place.x).toBe(330);
    // The tool is still there: another plank makes another birdhouse.
    h.do(w, put('planks', 260));
    expect(kindsOnBench(w).filter((k) => k === 'birdhouse')).toHaveLength(2);
  });

  it('one undo takes the made thing away and puts the bench back; redo makes it again', () => {
    const w = createWorld(1);
    const h = new History();
    h.do(w, put('screwdriver', 210));
    h.do(w, put('magnet', 260));
    const before = structuredClone(w.objects);
    h.do(w, put('nutAndBolt', 320));
    expect(kindsOnBench(w).toSorted()).toEqual(['robot', 'screwdriver']);
    const robotId = w.objects.find((o) => o.kind === 'robot')?.id;
    h.undo(w);
    expect(w.objects).toEqual(before);
    h.redo(w);
    expect(kindsOnBench(w).toSorted()).toEqual(['robot', 'screwdriver']);
    expect(w.objects.find((o) => o.kind === 'robot')?.id).toBe(robotId);
  });

  it('moves a thing already in the room onto the bench, and undo puts it back where it was', () => {
    const w = createWorld(1);
    const h = new History();
    const floor = { buildingId: 'workshop', roomId: ROOM, x: 600, y: 480 };
    h.do(w, { type: 'placeObject', kind: 'wheel', place: floor });
    const wheel = w.objects[0];
    h.do(w, put('wrench', 220));
    h.do(w, put('wheel', 300, { objectId: wheel?.id }));
    expect(kindsOnBench(w).toSorted()).toEqual(['toyCar', 'wrench']);
    expect(w.objects.some((o) => o.id === wheel?.id)).toBe(false);
    h.undo(w);
    const back = w.objects.find((o) => o.id === wheel?.id);
    expect(back?.place).toMatchObject({ x: 600, y: 480 });
    expect(back?.raise).toBeUndefined();
    expect(kindsOnBench(w)).toEqual(['wrench']);
  });

  it('stands things side by side in free places, nearest the finger', () => {
    const w = createWorld(1);
    const h = new History();
    const at = (x: number) => benchSlotX(w, ROOM, BENCH, x);
    const first = at(300);
    h.do(w, put('hammer', first));
    const second = at(300);
    expect(second).not.toBe(first);
    h.do(w, put('magnet', second));
    const third = at(300);
    expect(new Set([first, second, third]).size).toBe(3);
    h.do(w, put('gear', third));
    // All taken: it goes where the finger is.
    expect(at(250)).toBe(250);
  });

  it('refuses a bench that is not there, never throwing', () => {
    const w = createWorld(1);
    const h = new History();
    expect(h.do(w, { ...put('hammer'), benchId: 'stool-1' })).toBe(false);
    expect(h.do(w, { ...put('hammer'), roomId: 'nowhere' })).toBe(false);
    expect(w.objects).toHaveLength(0);
  });

  it('bots tinkering sometimes leave a little thing on the floor, never touching the bench', () => {
    const w = createWorld(3);
    const h = new History();
    h.do(w, put('hammer', 220));
    h.do(w, put('magnet', 300));
    const child = structuredClone(w.objects);
    const bot = getBot(w, 'moku');
    if (!bot) throw new Error('no moku');
    bot.place = { buildingId: 'workshop', roomId: ROOM, x: 300, y: 470 };
    for (let i = 0; i < 40; i++) {
      w.minute += 40;
      botTinkered(w, bot, `furniture:${ROOM}:${BENCH}`);
    }
    const made = w.objects.filter((o) => o.placedBy === 'bot');
    expect(made.length).toBeGreaterThan(0);
    expect(made.length).toBe(1);
    expect(made.every((o) => !o.raise && o.madeBy === 'bot')).toBe(true);
    for (const o of child) expect(w.objects).toContainEqual(o);
    // Not at a bench: nothing.
    const n = w.objects.length;
    botTinkered(w, bot, 'furniture:workshop-garage:carLift-1');
    expect(w.objects).toHaveLength(n);
  });

  it('is deterministic', () => {
    const a = createWorld(9);
    const b = createWorld(9);
    run(a, 6000);
    run(b, 6000);
    expect(a.objects).toEqual(b.objects);
  });
});

describe('the garage car', () => {
  it('is shiny for a game day after fixing, and undo makes it broken again', () => {
    const w = createWorld(1);
    const h = new History();
    const key = 'workshop-garage:carLift-1';
    expect(carIsShiny(w, key)).toBe(false);
    h.do(w, { type: 'fixCar', key });
    expect(carIsShiny(w, key)).toBe(true);
    h.undo(w);
    expect(carIsShiny(w, key)).toBe(false);
    h.redo(w);
    w.minute += CAR_SHINY_MINUTES;
    expect(carIsShiny(w, key)).toBe(false);
  });
});

describe('saved towns', () => {
  it('an old save (schema 1, no fixed cars) loads and the bench works in it', async () => {
    resetSaveState();
    const old = createWorld(2);
    const raw: Record<string, unknown> = { ...old };
    delete raw.houses;
    delete raw.fixedCars;
    for (const s of SAVE_SLOTS) await set(s, undefined);
    await set(
      SAVE_SLOTS[0],
      JSON.stringify({ schema: 1, savedAt: 1, generation: 1, world: raw, ui: { roomId: ROOM } }),
    );
    const file = await loadSave();
    if (!file) throw new Error('did not load');
    const w = file.world;
    expect(carIsShiny(w, 'workshop-garage:carLift-1')).toBe(false);
    const h = new History();
    h.do(w, put('ruler', 220));
    h.do(w, put('planks', 300));
    expect(kindsOnBench(w).toSorted()).toEqual(['boat', 'ruler']);
  });
});
