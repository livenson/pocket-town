import { set } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';
import { SAVE_SLOTS, loadSave, migrate, resetSaveState, writeSave } from '../../src/persist/save';
import { createWorld } from '../../src/sim/world';

beforeEach(async () => {
  resetSaveState();
  for (const s of SAVE_SLOTS) await set(s, undefined);
});

describe('saving', () => {
  it('round-trips the world', async () => {
    const w = createWorld(5);
    await writeSave(w, { roomId: 'home-bedroom' });
    const loaded = await loadSave();
    expect(loaded?.world).toEqual(w);
    expect(loaded?.ui.roomId).toBe('home-bedroom');
  });

  it('loads the newest save, written to alternating slots', async () => {
    const w = createWorld(5);
    await writeSave(w, { roomId: 'a' });
    w.minute = 99;
    await writeSave(w, { roomId: 'b' });
    expect((await loadSave())?.ui.roomId).toBe('b');
  });

  it('falls back to the last good copy when the newest is corrupted', async () => {
    const w = createWorld(5);
    await writeSave(w, { roomId: 'good' });
    await writeSave(w, { roomId: 'newer' });
    // Break the newer slot (generation 2 lives in slot index 0).
    await set(SAVE_SLOTS[0], '{"schema":1, "broken');
    resetSaveState();
    expect((await loadSave())?.ui.roomId).toBe('good');
  });

  it('rejects things that are not saves, and unknown future schemas', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ schema: 1, world: {} })).toBeNull();
    expect(migrate({ schema: 99, world: {} })).toBeNull();
  });
});
