import { describe, expect, it } from 'vitest';
import type { Appearance } from '../../src/content/appearance';
import { pegGeometry } from '../../src/stage/peg/geometry';

const base: Appearance = {
  skin: '#E9B48A',
  outfit: '#EF4B2F',
  hair: '#2A1640',
  hairStyle: 'bob',
  aid: 'none',
};

describe('peg geometry (DESIGN.md → Peg-folk)', () => {
  it('follows the construction ratios', () => {
    const g = pegGeometry(150, base);
    expect(g.W).toBe(Math.round(150 * 0.62));
    expect(g.d).toBe(Math.round(g.W * 0.86));
    expect(g.head.y).toBeCloseTo(15); // top at 0.1 H
    expect(g.body.y).toBeCloseTo(15 + g.d * 0.8);
    expect(g.body.y + g.body.h).toBeCloseTo(150); // feet at H
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

  it('adds helpers: wheelchair widens the figure; hearing aid and arm', () => {
    const wc = pegGeometry(150, { ...base, aid: 'wheelchair' });
    expect(wc.wheelchair).not.toBeNull();
    expect(wc.RW).toBeCloseTo(wc.W * 1.25);
    expect(pegGeometry(150, { ...base, aid: 'hearing' }).hear).not.toBeNull();
    expect(pegGeometry(150, { ...base, aid: 'arm' }).arm).not.toBeNull();
    expect(pegGeometry(150, base).wheelchair).toBeNull();
  });
});
