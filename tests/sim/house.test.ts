import { describe, expect, it } from 'vitest';
import { buildingOf, emptyHouse, houseRooms, readyHouse, roomIdOf } from '../../src/content/house';
import { findBuilding } from '../../src/content/rooms';
import { migrate } from '../../src/persist/save';
import { History } from '../../src/sim/history';
import { syncHouses } from '../../src/sim/houses';
import { run } from '../../src/sim/step';
import { createWorld, getBot, roomPath } from '../../src/sim/world';

describe('houses the child builds', () => {
  it('become buildings: rooms in a row joined by doors, the first with the front door', () => {
    const h = readyHouse(emptyHouse('h2', 2, 1));
    const b = buildingOf(h, 'House 2');
    expect(b.rooms.map((r) => r.id)).toEqual([0, 1, 2, 3].map((i) => roomIdOf(h, i)));
    expect(b.rooms[0]?.doors[0]?.to).toBe('outside');
    expect(b.rooms[1]?.doors.map((d) => d.to)).toEqual([roomIdOf(h, 0), roomIdOf(h, 2)]);
    // Every placed item becomes a piece of furniture, scaled to fit its cell.
    const pieces = b.rooms.flatMap((r) => r.furniture.filter((f) => f.standing));
    expect(pieces).toHaveLength(h.items.length);
    for (const p of pieces) expect(p.scale).toBeLessThanOrEqual(1);
  });

  it('skips empty spaces', () => {
    const h = emptyHouse('h3', 3, 0);
    h.rooms = ['kitchen', null, 'bed', null];
    expect(houseRooms(h)).toEqual([0, 2]);
    expect(buildingOf(h, 'House 3').rooms).toHaveLength(2);
  });

  it('every house edit is undoable, and the house appears in the town', () => {
    const w = createWorld(1);
    const hist = new History();
    const h = emptyHouse('h2', 2, 0);
    h.rooms = ['kitchen', 'bed', null, null];
    hist.do(w, { type: 'setHouse', house: h });
    expect(findBuilding('h2')).toBeTruthy();
    expect(roomPath(roomIdOf(h, 0), roomIdOf(h, 1))).toEqual([roomIdOf(h, 1)]);
    hist.do(w, { type: 'setHouse', house: { ...h, shell: 'dome' } });
    hist.do(w, { type: 'moveIn', botId: 'pim', houseId: 'h2' });
    expect(getBot(w, 'pim')?.homeId).toBe('h2');
    hist.undo(w);
    expect(getBot(w, 'pim')?.homeId).toBe('home');
    hist.undo(w);
    expect(w.houses[0]?.shell).toBe('cottage');
    hist.undo(w);
    expect(w.houses).toHaveLength(0);
    expect(findBuilding('h2')).toBeUndefined();
  });

  it('residents go home to the new house, and use its furniture', () => {
    const w = createWorld(4);
    const h = readyHouse(emptyHouse('h2', 2, 0));
    const hist = new History();
    hist.do(w, { type: 'setHouse', house: h });
    hist.do(w, { type: 'moveIn', botId: 'oki', houseId: 'h2' });
    const used = new Set<string>();
    for (let i = 0; i < 12_000; i++) {
      run(w, 1);
      const oki = getBot(w, 'oki');
      if (oki?.now?.phase === 'doing' && oki.place.buildingId === 'h2') used.add(oki.now.activity);
    }
    expect(used.size).toBeGreaterThan(0);
  });

  it('a housewarming brings neighbours round', () => {
    const w = createWorld(6);
    const hist = new History();
    hist.do(w, { type: 'setHouse', house: readyHouse(emptyHouse('h2', 2, 0)) });
    hist.do(w, { type: 'housewarming', houseId: 'h2' });
    const visitors = w.bots.filter(
      (b) => b.now?.activity === 'visit' && b.now.targetId === 'building:h2',
    );
    expect(visitors.length).toBeGreaterThan(0);
    expect(w.houses[0]?.warmed).toBe(true);
  });

  it('older saves gain an empty list of houses (schema 1 → 2)', () => {
    const w = createWorld(1);
    const { houses: _gone, ...old } = w;
    const migrated = migrate({
      schema: 1,
      savedAt: 1,
      generation: 1,
      world: old,
      ui: { roomId: 'home-living' },
    });
    expect(migrated?.schema).toBe(2);
    expect(migrated?.world.houses).toEqual([]);
    syncHouses(createWorld(1));
  });
});
