import { get, set } from 'idb-keyval';
import { describe, expect, it } from 'vitest';
import { enterProfile, removePlayer, saveNow } from '../../src/app/game';
import { slotsFor } from '../../src/persist/save';
import { useProfiles, type Profile } from '../../src/state/profiles';

const player = (id: string, name: string): Profile => ({
  id,
  name,
  appearance: { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' },
  traits: ['brave', 'chatty', 'snacky'],
  age: 8,
  hintsDone: true,
  createdAt: 1,
});

describe('removing a player (grown-up area)', () => {
  it('removes the profile and their saved town, and an open town is not saved back', async () => {
    useProfiles.setState({ profiles: [player('pa', 'Ada'), player('pb', 'Bea')], activeId: null });
    await enterProfile('pa');
    await saveNow();
    const [a, b] = slotsFor('pa');
    expect((await get(a)) ?? (await get(b))).toBeDefined();

    const { wasOpen } = await removePlayer('pa');
    expect(wasOpen).toBe(true);
    expect(useProfiles.getState().profiles.map((p) => p.id)).toEqual(['pb']);
    expect(useProfiles.getState().activeId).toBeNull();
    expect(await get(a)).toBeUndefined();
    expect(await get(b)).toBeUndefined();

    // Autosave after removal must not write the removed town back.
    await saveNow();
    expect(await get(a)).toBeUndefined();
    expect(await get(b)).toBeUndefined();
  });

  it('removing the last player also clears the town from before profiles', async () => {
    useProfiles.setState({ profiles: [player('pc', 'Cy')], activeId: null });
    const legacy = slotsFor(null);
    await set(legacy[0], 'old town');
    const { wasOpen } = await removePlayer('pc');
    expect(wasOpen).toBe(false);
    expect(await get(legacy[0])).toBeUndefined();
  });

  it('with no town open, removing the last player keeps the old town from coming back', async () => {
    useProfiles.setState({ profiles: [player('pd', 'Dee')], activeId: null });
    const legacy = slotsFor(null);
    await set(legacy[0], 'old town');
    await removePlayer('pd');
    await saveNow(); // the 30-second autosave
    expect(await get(legacy[0])).toBeUndefined();
    expect(await get(legacy[1])).toBeUndefined();
  });
});
