import { describe, expect, it } from 'vitest';
import type { Appearance } from '../../src/content/appearance';
import { randomLook, withFigure } from '../../src/content/looks';
import { pegGeometry } from '../../src/stage/peg/geometry';
import { lashPrims, mix } from '../../src/stage/peg/outfit';

/** How many eyelash strokes a character gets. */
const lashes = (a: Appearance) => lashPrims(pegGeometry(150, a)).length;

const base: Appearance = { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' };

describe('peg-folk lashes and colours', () => {
  it('girls have eyelashes; boys and older characters do not', () => {
    expect(lashes({ ...base, figure: 'girl' })).toBeGreaterThan(0);
    expect(lashes({ ...base, figure: 'boy' })).toBe(0);
    expect(lashes(base)).toBe(0);
    // Asleep: no lashes on closed eyes.
    expect(lashPrims(pegGeometry(150, { ...base, figure: 'girl' }, 'sleep'))).toHaveLength(0);
  });

  it('blends colours', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#EF4B2F', '#EF4B2F', 0.3).toUpperCase()).toBe('#EF4B2F');
  });
});

describe('boy or girl in the wizard', () => {
  it('swaps hair and clothes typical of the other, and keeps the child’s own picks', () => {
    const boy = withFigure({ ...base, hairStyle: 'pigtails', clothes: 'dress' }, 'boy');
    expect(boy).toMatchObject({ figure: 'boy', hairStyle: 'crop', clothes: 'pants' });
    // A girl in a space suit with a puff stays exactly that.
    const girl = withFigure({ ...base, hairStyle: 'puff', clothes: 'space' }, 'girl');
    expect(girl).toMatchObject({ figure: 'girl', hairStyle: 'puff', clothes: 'space' });
  });

  it('the dice always gives a figure and clothes', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 50; i++) {
      const a = randomLook(random);
      expect(a.figure).toBeDefined();
      expect(a.clothes).toBeDefined();
    }
  });
});
