import { describe, expect, it } from 'vitest';
import { clampFace, type Appearance } from '../../src/content/appearance';
import { randomFace } from '../../src/content/looks';
import {
  beardPrims,
  browPrims,
  detailedEyes,
  earPrims,
  eyePrims,
  fringePrims,
  nosePrims,
  tattooPrims,
} from '../../src/stage/peg/face';
import { pegGeometry } from '../../src/stage/peg/geometry';

const base: Appearance = { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' };
const geo = (a: Appearance) => pegGeometry(150, a);

describe('advanced face detail', () => {
  it('a face without detail draws exactly as the classic peg', () => {
    const g = geo(base);
    expect(g.headRx).toBe(g.d / 2);
    expect(g.headRy).toBe(g.d / 2);
    const all = [
      ...earPrims(g, base),
      ...fringePrims(g, base),
      ...eyePrims(g, base),
      ...browPrims(g, base),
      ...nosePrims(g, base),
      ...beardPrims(g, base, 'under'),
      ...beardPrims(g, base, 'over'),
      ...tattooPrims(g, base, 'arm'),
      ...tattooPrims(g, base, 'cheek'),
    ];
    expect(all).toEqual([]);
    expect(detailedEyes(g, base)).toBe(false);
  });

  it('keeps sizes in range, whatever a photo or an old save says', () => {
    expect(clampFace({ eyeSize: 9, eyeGap: -3, mouthWidth: Number.NaN })).toMatchObject({
      eyeSize: 1.3,
      eyeGap: 0.85,
      mouthWidth: undefined,
    });
  });

  it('bigger and wider-apart eyes move around their centres', () => {
    const plain = geo(base);
    const big = geo({ ...base, face: { eyeSize: 1.2, eyeGap: 1.1 } });
    const [l, r] = big.eyes;
    const [pl, pr] = plain.eyes;
    expect(l.w).toBeGreaterThan(pl.w);
    expect(r.x + r.w / 2 - (l.x + l.w / 2)).toBeGreaterThan(pr.x + pr.w / 2 - (pl.x + pl.w / 2));
  });

  it('draws whites, irises and pupils for detailed eyes, but sleep eyes stay bars', () => {
    const a: Appearance = { ...base, face: { eyes: 'round', eyeColour: '#3D7BD9' } };
    expect(eyePrims(geo(a), a).some((p) => p.t === 'ellipse' && p.fill === '#3D7BD9')).toBe(true);
    expect(detailedEyes(pegGeometry(150, a, 'sleep'), a)).toBe(false);
  });

  it('puts a moustache over the mouth and a beard under it', () => {
    const a: Appearance = { ...base, face: { beard: 'full' } };
    expect(beardPrims(geo(a), a, 'under').length).toBeGreaterThan(0);
    expect(beardPrims(geo(a), a, 'over').length).toBeGreaterThan(0);
    const m: Appearance = { ...base, face: { beard: 'moustache' } };
    expect(beardPrims(geo(m), m, 'under')).toEqual([]);
  });

  it('a play tattoo on the cheek is drawn with the face (one on the arm by the rig)', () => {
    const arm: Appearance = { ...base, face: { tattoo: 'star' } };
    expect(tattooPrims(geo(arm), arm, 'cheek')).toEqual([]);
    const cheek: Appearance = { ...base, face: { tattoo: 'heart', tattooPlace: 'cheek' } };
    expect(tattooPrims(geo(cheek), cheek, 'cheek').length).toBeGreaterThan(0);
  });

  it('ears only for people', () => {
    const cat: Appearance = { ...base, kind: 'cat', face: { ears: true } };
    expect(earPrims(geo(cat), cat)).toEqual([]);
  });

  it('the dice gives new characters a detailed face, never a beard or tattoo', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) {
      const f = randomFace(random);
      expect(f.eyes).not.toBe('dots');
      expect(f.beard).toBeUndefined();
      expect(f.tattoo).toBeUndefined();
    }
  });
});
