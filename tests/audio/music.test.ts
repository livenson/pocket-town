import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZZFX } from 'zzfx';
import { music } from '../../src/audio/music';

describe('background music player', () => {
  afterEach(() => {
    music.setMood(null);
    vi.useRealTimers();
  });

  it('never throws when audio says it runs but cannot make sounds (test browsers)', () => {
    vi.useFakeTimers();
    const ctx = ZZFX.audioContext;
    const state = Object.getOwnPropertyDescriptor(ctx, 'state');
    Object.defineProperty(ctx, 'state', { value: 'running', configurable: true });
    try {
      music.setMood('cosy');
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    } finally {
      if (state) Object.defineProperty(ctx, 'state', state);
      else delete (ctx as { state?: string }).state;
    }
  });
});
