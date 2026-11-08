import { describe, expect, it } from 'vitest';
import type { Appearance } from '../../src/content/appearance';
import { bodyExtras, headExtras } from '../../src/stage/peg/extras';
import { pegGeometry } from '../../src/stage/peg/geometry';

const base: Appearance = {
  skin: '#E9B48A',
  outfit: '#EF4B2F',
  hair: '#2A1640',
  hairStyle: 'bob',
};

describe('peg geometry (DESIGN.md → Peg-folk)', () => {
  it('follows the construction ratios', () => {
    const g = pegGeometry(150, base);
    expect(g.W).toBe(Math.round(150 * 0.62));
    expect(g.d).toBe(Math.round(g.W * 0.86));
    expect(g.head.y).toBeCloseTo(15); // top at 0.1 H
    expect(g.body.y).toBeCloseTo(15 + g.d * 0.8);
    // The body ends above the legs; the shoes reach the feet at H.
    expect(g.body.y + g.body.h).toBeLessThan(150);
    const [left] = g.legs;
    expect(left.y).toBeLessThan(g.body.y + g.body.h);
    expect(left.y + left.h + g.shoeH / 2).toBeCloseTo(150);
    expect(g.head.x + g.d / 2).toBeCloseTo(g.W / 2); // head centred
  });

  it('places eyes at 30% and 60% across, 47% down the head', () => {
    const g = pegGeometry(150, base);
    expect(g.eyes[0].x).toBeCloseTo(g.head.x + g.d * 0.3);
    expect(g.eyes[1].x).toBeCloseTo(g.head.x + g.d * 0.6);
    expect(g.eyes[0].y).toBeCloseTo(g.head.y + g.d * 0.47);
    expect(g.eyeShape).toBe('dot');
  });

  it('draws sleep eyes as bars and wow eyes as ovals with an "o" mouth', () => {
    expect(pegGeometry(150, base, 'sleep').eyeShape).toBe('bar');
    const wow = pegGeometry(150, base, 'wow');
    expect(wow.eyeShape).toBe('oval');
    expect(wow.mouthShape).toBe('o');
  });

  it.each([
    ['bob', { cap: true, locks: true, top: false }],
    ['crop', { cap: true, locks: false, top: false }],
    ['puff', { cap: true, locks: false, top: true }],
    ['bun', { cap: true, locks: false, top: true }],
    ['none', { cap: false, locks: false, top: false }],
  ] as const)('hair style %s', (hairStyle, expected) => {
    const g = pegGeometry(150, { ...base, hairStyle });
    expect({ cap: g.cap !== null, locks: g.locks !== null, top: g.top !== null }).toEqual(expected);
  });

  it('animals get ears and a nose; people do not', () => {
    const person = headExtras(pegGeometry(150, base), base).length;
    for (const kind of ['cat', 'dog', 'bear', 'bunny', 'mouse'] as const) {
      const a = { ...base, kind };
      expect(headExtras(pegGeometry(150, a), a).length).toBeGreaterThan(person);
    }
  });

  it('long hair reaches the shoulders; spikes and pigtails are extra shapes', () => {
    const bob = pegGeometry(150, { ...base, hairStyle: 'bob' });
    const long = pegGeometry(150, { ...base, hairStyle: 'long' });
    expect(long.locks?.[0].h ?? 0).toBeGreaterThan(bob.locks?.[0].h ?? 0);
    const plain = headExtras(pegGeometry(150, { ...base, hairStyle: 'crop' }), base).length;
    for (const hairStyle of ['spiky', 'pigtails'] as const) {
      const a = { ...base, hairStyle };
      expect(headExtras(pegGeometry(150, a), a).length).toBeGreaterThan(plain);
    }
  });

  it('draws every new pattern, accessory and freckles', () => {
    for (const pattern of ['heart', 'star'] as const) {
      const a = { ...base, pattern };
      expect(bodyExtras(pegGeometry(150, a), a).length).toBeGreaterThan(0);
    }
    for (const accessory of ['headband', 'flower', 'crown'] as const) {
      const a = { ...base, accessory };
      expect(headExtras(pegGeometry(150, a), a).length).toBeGreaterThan(0);
    }
    const f = { ...base, freckles: true };
    expect(headExtras(pegGeometry(150, f), f).length).toBe(6);
  });
});
