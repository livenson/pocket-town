import { describe, expect, it } from 'vitest';
import { EDGES, initialNav, navigate, type NavState, type ScreenId } from '../../src/app/machine';

const go = (s: NavState, to: ScreenId) => navigate(s, { type: 'go', to });

describe('screen machine', () => {
  it('follows the first-run path', () => {
    let s = initialNav;
    s = go(s, 'age');
    s = go(s, 'profile');
    s = go(s, 'hub');
    expect(s.screen).toBe('hub');
    expect(s.history).toEqual(['splash', 'age', 'profile']);
  });

  it('back returns to the previous screen; home clears history', () => {
    let s = go(go({ ...initialNav, screen: 'hub' }, 'map'), 'scene');
    s = navigate(s, { type: 'back' });
    expect(s.screen).toBe('map');
    s = navigate(s, { type: 'home' });
    expect(s).toMatchObject({ screen: 'hub', history: [] });
  });

  it('back with no history goes home, except on the splash', () => {
    expect(navigate({ ...initialNav, screen: 'map' }, { type: 'back' }).screen).toBe('hub');
    expect(navigate(initialNav, { type: 'back' }).screen).toBe('splash');
  });

  it('grown-up screens sit behind the gate', () => {
    let s = go({ ...initialNav, screen: 'hub' }, 'grownUp');
    expect(s.screen).toBe('gate');
    expect(s.gateTarget).toBe('grownUp');
    s = navigate(s, { type: 'gatePassed' });
    expect(s).toMatchObject({ screen: 'grownUp', unlocked: true });
    s = go(s, 'kit');
    expect(s.screen).toBe('kit');
  });

  it('leaving the grown-up area locks it again, and back never re-enters the gate', () => {
    let s = navigate(go({ ...initialNav, screen: 'hub' }, 'grownUp'), { type: 'gatePassed' });
    s = go(s, 'settings');
    expect(s.unlocked).toBe(false);
    s = navigate(s, { type: 'back' });
    // grownUp is locked now, and the gate is skipped: back lands on the hub.
    expect(s.screen).toBe('hub');
  });

  it('gatePassed does nothing outside the gate', () => {
    const s = { ...initialNav, screen: 'hub' as const };
    expect(navigate(s, { type: 'gatePassed' })).toBe(s);
  });

  it('every edge points at a known screen', () => {
    const screens = new Set(Object.keys(EDGES));
    for (const targets of Object.values(EDGES)) {
      for (const t of targets) expect(screens.has(t)).toBe(true);
    }
  });
});
