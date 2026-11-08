import { describe, expect, it } from 'vitest';
import type { Appearance } from '../../src/content/appearance';
import { clothesKinds, randomLook, withFigure } from '../../src/content/looks';
import { pegGeometry } from '../../src/stage/peg/geometry';
import {
  armPrims,
  backPrims,
  bodyFill,
  clothesPrims,
  helmetPrims,
  lashPrims,
  mix,
} from '../../src/stage/peg/outfit';

/** How many eyelash strokes a character gets. */
const lashes = (a: Appearance) => lashPrims(pegGeometry(150, a)).length;

const base: Appearance = { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' };

describe('peg-folk arms, legs and clothes', () => {
  it('everyone has two arms with hands and two legs with shoes (older saves too)', () => {
    const g = pegGeometry(150, base);
    expect(armPrims(g, base).filter((p) => p.t === 'line')).toHaveLength(2);
    expect(backPrims(g, base).filter((p) => p.t === 'ellipse').length).toBeGreaterThanOrEqual(2);
  });

  it('draws every outfit, and only the space suit has a helmet', () => {
    const plain = backPrims(pegGeometry(150, base), base).length;
    const drawn = clothesKinds.map((clothes) => {
      const a = { ...base, clothes };
      const g = pegGeometry(150, a);
      return {
        clothes,
        helmet: helmetPrims(g, a).length > 0,
        extra: [...backPrims(g, a), ...clothesPrims(g, a)].length > plain,
      };
    });
    expect(drawn).toEqual(
      clothesKinds.map((clothes) => ({
        clothes,
        helmet: clothes === 'space',
        extra: clothes !== 'tunic',
      })),
    );
    expect(bodyFill(pegGeometry(150, { ...base, clothes: 'space' }), base)).not.toBe(base.outfit);
  });

  it('girls have eyelashes; boys and older characters do not', () => {
    expect(lashes({ ...base, figure: 'girl' })).toBeGreaterThan(0);
    expect(lashes({ ...base, figure: 'boy' })).toBe(0);
    expect(lashes(base)).toBe(0);
    // Asleep: no lashes on closed eyes.
    expect(lashPrims(pegGeometry(150, { ...base, figure: 'girl' }, 'sleep'))).toHaveLength(0);
  });

  it('boys have broader, squarer shoulders than girls', () => {
    const boy = pegGeometry(150, { ...base, figure: 'boy' }).bodyCorners.ry[0];
    const girl = pegGeometry(150, { ...base, figure: 'girl' }).bodyCorners.ry[0];
    expect(boy).toBeLessThan(girl);
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
