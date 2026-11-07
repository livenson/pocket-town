import { describe, expect, it } from 'vitest';
import { names, randomLook, randomName, randomTraits } from '../../src/content/looks';

describe('surprise me', () => {
  it('rolls a full look from the palette', () => {
    const look = randomLook(() => 0.5);
    expect(look).toMatchObject({
      hairStyle: expect.any(String),
      skin: expect.stringMatching(/^#/),
    });
  });

  it('never repeats the same name twice in a row', () => {
    const first = names[0];
    expect(randomName(first, () => 0)).not.toBe(first);
  });

  it('gives three different traits', () => {
    for (let i = 0; i < 20; i++) expect(new Set(randomTraits()).size).toBe(3);
  });
});
