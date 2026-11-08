import { describe, expect, it } from 'vitest';
import { frequency, INSTRUMENTS } from '../../src/audio/piano';

describe('hidden piano', () => {
  it('tunes to A440 in equal temperament', () => {
    expect(frequency(69)).toBeCloseTo(440);
    expect(frequency(60)).toBeCloseTo(261.63, 1);
    expect(frequency(81)).toBeCloseTo(880);
  });

  it('offers several instruments', () => {
    expect(INSTRUMENTS.length).toBeGreaterThanOrEqual(4);
  });
});
