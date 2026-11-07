import { describe, expect, it } from 'vitest';
import { clampFurniture, furnitureKinds } from '../../src/content/furniture';
import { findRoom } from '../../src/content/rooms';
import { collectAds } from '../../src/sim/ads';
import { History } from '../../src/sim/history';
import { syncHouses } from '../../src/sim/houses';
import { run } from '../../src/sim/step';
import { createWorld } from '../../src/sim/world';

const ids = (roomId: string) => findRoom(roomId)?.furniture.map((f) => f.id) ?? [];

describe('decorating a room', () => {
  it('adds, moves, turns and removes furniture; undo and redo put it back', () => {
    const w = createWorld(3);
    syncHouses(w);
    const h = new History();
    const before = ids('home-living');
    expect(
      h.do(w, {
        type: 'addFurniture',
        roomId: 'home-living',
        piece: { id: 'd1', kind: 'sofa', x: 500, y: 330 },
      }),
    ).toBe(true);
    expect(ids('home-living')).toEqual([...before, 'd1']);
    // Characters can use what the child added.
    const bot = w.bots[0];
    if (!bot) throw new Error('no bot');
    expect(collectAds(w, bot).some((a) => a.targetId.includes('d1'))).toBe(true);

    h.do(w, { type: 'moveFurniture', roomId: 'home-living', id: 'd1', x: 100, y: 300, flip: true });
    const moved = findRoom('home-living')?.furniture.find((f) => f.id === 'd1');
    expect(moved?.flip).toBe(true);
    expect(moved?.x).toBe(100);

    h.do(w, { type: 'removeFurniture', roomId: 'home-living', id: 'd1' });
    expect(ids('home-living')).toEqual(before);

    h.undo(w);
    h.undo(w);
    expect(findRoom('home-living')?.furniture.find((f) => f.id === 'd1')?.x).toBe(500);
    h.undo(w);
    expect(ids('home-living')).toEqual(before);
    expect(w.roomEdits?.['home-living']).toBeUndefined();
    h.redo(w);
    expect(ids('home-living')).toContain('d1');
  });

  it('keeps doors where they are, and pieces where they can stand', () => {
    const w = createWorld(3);
    syncHouses(w);
    const h = new History();
    const door = findRoom('home-living')?.furniture.find((f) => f.kind === 'door');
    if (!door) throw new Error('no door');
    expect(h.do(w, { type: 'removeFurniture', roomId: 'home-living', id: door.id })).toBe(false);
    expect(h.do(w, { type: 'moveFurniture', roomId: 'home-living', id: door.id, x: 5, y: 5 })).toBe(
      false,
    );
    // A sofa dragged up the wall lands with its feet on the floor; a window stays on the wall.
    const sofa = clampFurniture({ id: 's', kind: 'sofa', x: 300, y: 0 });
    expect(sofa.y + (furnitureKinds.sofa.footY ?? furnitureKinds.sofa.h)).toBeGreaterThanOrEqual(
      362,
    );
    const win = clampFurniture({ id: 'w', kind: 'window', x: 300, y: 500 });
    expect(win.y + furnitureKinds.window.h).toBeLessThanOrEqual(370);
    // Nothing leaves the room sideways.
    expect(clampFurniture({ id: 't', kind: 'table', x: 5000, y: 400 }).x).toBeLessThan(900);
  });

  it('the town keeps going when the child takes the beds away', () => {
    const w = createWorld(11);
    syncHouses(w);
    const h = new History();
    for (const f of findRoom('home-bedroom')?.furniture ?? []) {
      if (f.kind === 'bed') h.do(w, { type: 'removeFurniture', roomId: 'home-bedroom', id: f.id });
    }
    expect(findRoom('home-bedroom')?.furniture.some((f) => f.kind === 'bed')).toBe(false);
    expect(() => run(w, 10 * 60 * 24)).not.toThrow();
    for (const b of w.bots) expect(Number.isFinite(b.needs.energy)).toBe(true);
    // Undo everything: the beds are back.
    while (h.canUndo) h.undo(w);
    expect(findRoom('home-bedroom')?.furniture.filter((f) => f.kind === 'bed')).toHaveLength(2);
  });
});
