import { describe, expect, it } from 'vitest';
import {
  BROKEN_SPOTS,
  CAR_SPOTS,
  CAR_TOOLS,
  allFixed,
  applyTool,
  breakdown,
  toolArt,
  toolFor,
} from '../../src/app/workshop/carFix';
import { thingArt } from '../../src/design/thingArt';
import { setLanguage, strings } from '../../src/i18n';

describe('the car-fixing game', () => {
  it('breaks a few spots, the same for the same seed, different on other days', () => {
    const a = breakdown(4);
    expect(a.broken).toHaveLength(BROKEN_SPOTS);
    expect(a.fixed).toEqual([]);
    expect(breakdown(4)).toEqual(a);
    const mixes = new Set(Array.from({ length: 20 }, (_, d) => breakdown(d).broken.join()));
    expect(mixes.size).toBeGreaterThan(3);
    for (const s of a.broken) expect(CAR_SPOTS).toContain(s);
  });

  it('the right tool mends a spot; the wrong one changes nothing', () => {
    let s = breakdown(1);
    const [first] = s.broken;
    if (!first) throw new Error('nothing broken');
    const wrongTool = CAR_TOOLS.find((t) => t !== toolFor[first]) ?? 'wrench';
    const miss = applyTool(s, first, wrongTool);
    expect(miss.result).toBe('wrong');
    expect(miss.state).toBe(s);
    const hit = applyTool(s, first, toolFor[first]);
    expect(hit.result).toBe('fixed');
    expect(hit.state.fixed).toEqual([first]);
    expect(applyTool(hit.state, first, toolFor[first]).result).toBe('already');
    s = hit.state;
    for (const spot of s.broken) s = applyTool(s, spot, toolFor[spot]).state;
    expect(allFixed(s)).toBe(true);
  });

  it('a spot that is not broken cannot be "fixed"', () => {
    const s = breakdown(2);
    const fine = CAR_SPOTS.find((x) => !s.broken.includes(x));
    if (!fine) throw new Error('everything broken');
    expect(applyTool(s, fine, toolFor[fine]).result).toBe('already');
  });

  it('every spot has its own tool, with a picture and a name in every language', () => {
    expect(new Set(CAR_SPOTS.map((s) => toolFor[s])).size).toBe(CAR_SPOTS.length);
    for (const t of CAR_TOOLS) expect(thingArt[toolArt[t]]).toBeTruthy();
    for (const lang of ['en', 'et', 'lv'] as const) {
      setLanguage(lang);
      for (const s of CAR_SPOTS) expect(strings.workshop.spots[s]).toBeTruthy();
      for (const t of CAR_TOOLS) expect(strings.workshop.carTools[t]).toBeTruthy();
    }
    setLanguage('en');
  });
});
