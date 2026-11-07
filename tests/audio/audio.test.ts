import { describe, expect, it } from 'vitest';
import { ZZFX } from 'zzfx';
import { playSfx } from '../../src/audio/audio';
import { sfx, zzfxParams } from '../../src/audio/sfx';

describe('audio', () => {
  it('maps named parameters to ZzFX positions', () => {
    expect(zzfxParams({ volume: 1, frequency: 440 })).toEqual([1, undefined, 440]);
    expect(zzfxParams({ filter: 100 })).toHaveLength(21);
  });

  it.each(Object.entries(sfx))('sound "%s" builds non-empty, finite samples', (_name, params) => {
    const samples = ZZFX.buildSamples(...params);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.every(Number.isFinite)).toBe(true);
  });

  it('playing a sound unlocks the audio context', () => {
    playSfx('pop');
    expect(ZZFX.audioContext.state).toBe('running');
  });
});
