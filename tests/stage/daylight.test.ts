import { describe, expect, it } from 'vitest';
import { daylight } from '../../src/stage/daylight';

describe('daylight', () => {
  it('is bright by day and dim at night, with a smooth dusk', () => {
    expect(daylight(12 * 60)).toMatchObject({ dim: 0, night: false, sky: '#BFE3FF' });
    expect(daylight(23 * 60)).toMatchObject({ night: true, sky: '#3B2A63' });
    expect(daylight(2 * 60).dim).toBeGreaterThan(0.2);
    const dusk = daylight(18.5 * 60);
    expect(dusk.dim).toBeGreaterThan(0);
    expect(dusk.dim).toBeLessThan(daylight(21 * 60).dim);
  });
});
