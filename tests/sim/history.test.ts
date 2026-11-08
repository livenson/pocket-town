import { describe, expect, it } from 'vitest';
import { History, HISTORY_LIMIT } from '../../src/sim/history';
import { run } from '../../src/sim/step';
import { createWorld, getBot } from '../../src/sim/world';
import { furnitureUseAt } from '../../src/sim/ads';
import { findRoom } from '../../src/content/rooms';

const livingFloor = { buildingId: 'home', roomId: 'home-living', x: 300, y: 500 };

describe('undo and redo', () => {
  it('undoes and redoes a gift', () => {
    const w = createWorld(1);
    const h = new History();
    const moku = getBot(w, 'moku');
    const before = moku?.now?.activity ?? null;
    h.do(w, { type: 'give', botId: 'moku', kind: 'cake' });
    expect(moku?.now?.targetId).toBe('gift:cake');
    h.undo(w);
    expect(moku?.now?.activity ?? null).toBe(before);
    h.redo(w);
    expect(moku?.now?.targetId).toBe('gift:cake');
  });

  it('undoes placing, moving and removing a thing, keeping its id on redo', () => {
    const w = createWorld(1);
    const h = new History();
    h.do(w, { type: 'placeObject', kind: 'ball', place: livingFloor });
    const id = w.objects[0]?.id;
    expect(id).toBeTruthy();
    h.do(w, { type: 'moveObject', id: id ?? '', place: { ...livingFloor, x: 600 } });
    expect(w.objects[0]?.place.x).toBe(600);
    h.undo(w);
    expect(w.objects[0]?.place.x).toBe(300);
    h.do(w, { type: 'removeObject', id: id ?? '' });
    expect(w.objects).toHaveLength(0);
    h.undo(w);
    expect(w.objects[0]?.id).toBe(id);
    h.undo(w);
    expect(w.objects).toHaveLength(0);
    h.redo(w);
    expect(w.objects[0]?.id).toBe(id);
  });

  it('undoes freeze, nudge and take-control', () => {
    const w = createWorld(2);
    const h = new History();
    const pim = getBot(w, 'pim');
    h.do(w, { type: 'freeze', botId: 'pim', on: true });
    expect(pim?.mode).toBe('frozen');
    h.undo(w);
    expect(pim?.mode).toBe('auto');
    h.do(w, { type: 'nudge', botId: 'pim', activity: 'read' });
    expect(pim?.nudge).toBe('read');
    h.undo(w);
    expect(pim?.nudge).toBeNull();
    h.do(w, { type: 'control', botId: 'pim', on: true });
    h.undo(w);
    expect(pim?.mode).toBe('auto');
  });

  it("does not record the bots' own choices, and keeps at least 50 steps", () => {
    const w = createWorld(3);
    const h = new History();
    run(w, 500);
    expect(h.canUndo).toBe(false);
    for (let i = 0; i < 60; i++)
      h.do(w, { type: 'placeObject', kind: 'cake', place: { ...livingFloor, x: 100 + i } });
    let undos = 0;
    while (h.undo(w)) undos++;
    expect(undos).toBeGreaterThanOrEqual(50);
    expect(undos).toBeLessThanOrEqual(HISTORY_LIMIT);
  });

  it('a new action clears the redo steps', () => {
    const w = createWorld(3);
    const h = new History();
    h.do(w, { type: 'placeObject', kind: 'cake', place: livingFloor });
    h.undo(w);
    expect(h.canRedo).toBe(true);
    h.do(w, { type: 'placeObject', kind: 'ball', place: livingFloor });
    expect(h.canRedo).toBe(false);
  });
});

describe('map decoration', () => {
  it('changing a tree or the pond is saved in the world and undoes cleanly', () => {
    const w = createWorld(5);
    const h = new History();
    expect(w.decor?.pond).toBeUndefined();
    h.do(w, { type: 'setDecor', id: 'pond', variant: 1 });
    h.do(w, { type: 'setDecor', id: 'pond', variant: 2 });
    h.do(w, { type: 'setDecor', id: 'tree-0', variant: 3 });
    expect(w.decor).toEqual({ pond: 2, 'tree-0': 3 });
    h.undo(w);
    h.undo(w);
    expect(w.decor).toEqual({ pond: 1 });
    h.undo(w);
    expect(w.decor?.pond).toBeUndefined();
    h.redo(w);
    expect(w.decor).toEqual({ pond: 1 });
  });
});

describe('bringing a character into a room (drag or tap from the dock)', () => {
  it('puts them right there, and undo puts them back where they were', () => {
    const w = createWorld(4);
    const h = new History();
    const bot = w.bots.find((b) => b.place.roomId !== 'cafe-main');
    if (!bot) throw new Error('no bot');
    const before = structuredClone(bot.place);
    const place = { buildingId: 'cafe', roomId: 'cafe-main', x: 300, y: 460 };
    expect(h.do(w, { type: 'bring', botId: bot.id, place })).toBe(true);
    const now = getBot(w, bot.id);
    expect(now?.place.roomId).toBe('cafe-main');
    expect(now?.place.x).toBe(300);
    expect(now?.travel).toBeNull();
    // They stay a little while instead of walking straight off.
    expect(now?.now?.byChild).toBe(true);
    run(w, 5);
    expect(getBot(w, bot.id)?.place.roomId).toBe('cafe-main');
    h.undo(w);
    expect(getBot(w, bot.id)?.place).toEqual(before);
  });
});

describe('putting a character on a piece of furniture', () => {
  const bath = findRoom('home-bath');
  const bedroom = findRoom('home-bedroom');

  it('finds what the piece under the drop offers: the toilet is a phone game', () => {
    const toilet = bath?.furniture.find((f) => f.kind === 'toilet');
    if (!bath || !toilet) throw new Error('no toilet');
    const use = furnitureUseAt(bath.id, bath.furniture, toilet.x + 50, toilet.y + 60);
    expect(use?.activity).toBe('phone');
    expect(use?.targetId).toBe(`furniture:home-bath:${toilet.id}`);
    // The empty floor offers nothing.
    expect(furnitureUseAt(bath.id, bath.furniture, 150, 540)).toBeNull();
  });

  it('a bed the child picks is a nap, never a night', () => {
    const bed = bedroom?.furniture.find((f) => f.kind === 'bed');
    if (!bedroom || !bed) throw new Error('no bed');
    expect(furnitureUseAt(bedroom.id, bedroom.furniture, bed.x + 100, bed.y + 50)?.activity).toBe(
      'nap',
    );
  });

  it('they start using it at once, and undo puts them back', () => {
    const w = createWorld(4);
    const h = new History();
    const bot = w.bots[0];
    const toilet = bath?.furniture.find((f) => f.kind === 'toilet');
    if (!bot || !bath || !toilet) throw new Error('missing');
    const before = structuredClone(bot.place);
    const use = furnitureUseAt(bath.id, bath.furniture, toilet.x + 50, toilet.y + 60);
    if (!use) throw new Error('no use');
    const { spot, ...doing } = use;
    const place = { buildingId: 'home', roomId: 'home-bath', ...spot };
    expect(h.do(w, { type: 'bring', botId: bot.id, place, use: doing })).toBe(true);
    expect(getBot(w, bot.id)?.now).toMatchObject({ activity: 'phone', phase: 'doing' });
    h.undo(w);
    expect(getBot(w, bot.id)?.place).toEqual(before);
  });
});
