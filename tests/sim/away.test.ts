import { describe, expect, it } from 'vitest';
import { AWAY_MAX_GAME_MINUTES, awayGameMinutes, catchUp } from '../../src/sim/away';
import { History } from '../../src/sim/history';
import { createWorld, getBot } from '../../src/sim/world';

describe('while you were away', () => {
  it('turns real time into game time, capped at two game days', () => {
    expect(awayGameMinutes(10 * 60_000)).toBeCloseTo(20 * 60); // 10 real minutes = 20 game hours
    expect(awayGameMinutes(24 * 3600_000)).toBe(AWAY_MAX_GAME_MINUTES);
  });

  it('catches the town up and finds three or four moments worth a picture', () => {
    const w = createWorld(9);
    const start = w.minute;
    const moments = catchUp(w, 20 * 60);
    expect(w.minute - start).toBeGreaterThanOrEqual(20 * 60);
    expect(moments.length).toBeGreaterThanOrEqual(3);
    expect(moments.length).toBeLessThanOrEqual(4);
    expect(new Set(moments.map((m) => m.activity)).size).toBe(moments.length);
    for (const m of moments) expect(getBot(w, m.botId)).toBeTruthy();
  });
});

describe('the characters gallery', () => {
  it('adds, changes and removes characters, all undoable', () => {
    const w = createWorld(2);
    const h = new History();
    const count = w.bots.length;
    const look = {
      skin: '#F6D2B4',
      outfit: '#EF4B2F',
      hair: '#2A1640',
      hairStyle: 'bob' as const,
    };
    h.do(w, {
      type: 'addBot',
      id: 'c1',
      name: 'Juno',
      appearance: look,
      traits: ['brave', 'tidy', 'shy'],
      homeId: 'home',
    });
    expect(w.bots).toHaveLength(count + 1);
    h.do(w, {
      type: 'updateBot',
      botId: 'c1',
      name: 'Juna',
      appearance: { ...look, hairStyle: 'puff' },
      traits: ['brave', 'tidy', 'shy'],
    });
    expect(getBot(w, 'c1')?.name).toBe('Juna');
    h.do(w, { type: 'removeBot', botId: 'moku' });
    expect(getBot(w, 'moku')).toBeUndefined();
    h.undo(w);
    expect(getBot(w, 'moku')).toBeTruthy();
    h.undo(w);
    expect(getBot(w, 'c1')?.name).toBe('Juno');
    h.undo(w);
    expect(w.bots).toHaveLength(count);
  });
});
