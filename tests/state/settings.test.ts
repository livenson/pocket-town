import { get } from 'idb-keyval';
import { describe, expect, it } from 'vitest';
import { defaultSettings, useSettings } from '../../src/state/settings';

describe('settings store', () => {
  it('starts with the defaults', () => {
    useSettings.getState().reset();
    expect(useSettings.getState()).toMatchObject(defaultSettings);
  });

  it('persists changes to IndexedDB (without the actions)', async () => {
    useSettings.getState().update({ calmMotion: true, botEnergy: 'calm' });
    await new Promise((r) => setTimeout(r, 20));
    const raw = await get<string>('pocket-town:settings');
    expect(raw).toBeTruthy();
    const saved: unknown = JSON.parse(raw ?? '{}');
    expect(saved).toMatchObject({ version: 1, state: { calmMotion: true, botEnergy: 'calm' } });
    expect(raw).not.toContain('"update"');
    useSettings.getState().reset();
  });
});
