import { describe, expect, it } from 'vitest';
import { mapPlaneAt, MAP_PLANE_PERIOD, MAP_PLANE_STAND } from '../../src/app/mapPlane';
import { RUNWAY_PERIOD, RUNWAY_STAND, runwayPlaneAt, windowPlaneAt } from '../../src/stage/planes';

const times = (period: number, step = 0.05) =>
  Array.from({ length: Math.round(period / step) + 1 }, (_, i) => i * step);

describe('the runway plane', () => {
  it('waits at its stand at the start (and with calm motion, which shows time 0)', () => {
    expect(runwayPlaneAt(0)).toEqual({ ...RUNWAY_STAND, tilt: 0, away: false });
  });

  it('takes off, flies away, comes back and lands where it started, without jumps', () => {
    let prev = runwayPlaneAt(0);
    let flew = false;
    let wasAway = false;
    let biggestStep = 0;
    for (const t of times(RUNWAY_PERIOD)) {
      const p = runwayPlaneAt(t);
      if (p.y < RUNWAY_STAND.y - 100) flew = true;
      if (p.away) wasAway = true;
      // Only a plane out of sight may jump (to come back from the other side).
      if (!p.away && !prev.away)
        biggestStep = Math.max(biggestStep, Math.hypot(p.x - prev.x, p.y - prev.y));
      prev = p;
    }
    expect(biggestStep).toBeLessThan(25);
    expect(flew).toBe(true);
    expect(wasAway).toBe(true);
    expect(runwayPlaneAt(RUNWAY_PERIOD - 0.01)).toMatchObject(RUNWAY_STAND);
  });

  it('noses up only when climbing, never down into the ground', () => {
    for (const t of times(RUNWAY_PERIOD)) {
      const p = runwayPlaneAt(t);
      expect(p.tilt).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(RUNWAY_STAND.y);
    }
  });

  it('a small plane passes the big window now and then', () => {
    const seen = times(30).map(windowPlaneAt);
    expect(seen.some((u) => u === null)).toBe(true);
    expect(seen.some((u) => u !== null && u > 0.4 && u < 0.6)).toBe(true);
  });
});

describe('the plane on the world map', () => {
  it('starts parked on the runway, facing west, on the ground', () => {
    const p = mapPlaneAt(0);
    expect(p.x).toBeCloseTo(MAP_PLANE_STAND.x);
    expect(p.y).toBeCloseTo(MAP_PLANE_STAND.y);
    expect(p.height).toBe(0);
    expect(Math.abs(Math.cos(p.heading) + 1)).toBeLessThan(1e-6);
  });

  it('flies a loop over the town that stays on the map, and comes home', () => {
    let prev = mapPlaneAt(0);
    let highest = 0;
    for (const t of times(MAP_PLANE_PERIOD)) {
      const p = mapPlaneAt(t);
      highest = Math.max(highest, p.height);
      expect(p.x).toBeGreaterThan(-0.05);
      expect(p.x).toBeLessThan(1.05);
      expect(p.y).toBeGreaterThan(-0.05);
      expect(p.y).toBeLessThan(1.05);
      expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(0.02);
      prev = p;
    }
    expect(highest).toBe(1);
    const end = mapPlaneAt(MAP_PLANE_PERIOD - 0.001);
    expect(end.x).toBeCloseTo(MAP_PLANE_STAND.x);
    expect(end.height).toBe(0);
  });

  it('is on the ground while it rolls along the runway', () => {
    for (const t of [9, 11, 13, 41, 43]) {
      const p = mapPlaneAt(t);
      expect(p.height).toBe(0);
      expect(p.y).toBeCloseTo(MAP_PLANE_STAND.y, 3);
    }
  });
});
