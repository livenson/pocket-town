import { afterEach, describe, expect, it } from 'vitest';
import { numberToWords as wordsIn } from '../../src/i18n/numbers';
import { numberToWords, setLanguage, strings, thingName } from '../../src/i18n';
import { en } from '../../src/i18n/strings.en';
import { et } from '../../src/i18n/strings.et';
import { lv } from '../../src/i18n/strings.lv';

afterEach(() => setLanguage('en'));

describe('number words for the parental gate', () => {
  it.each([
    [0, 'zero'],
    [7, 'seven'],
    [13, 'thirteen'],
    [20, 'twenty'],
    [47, 'forty-seven'],
    [99, 'ninety-nine'],
  ])('English %i → %s', (n, words) => {
    expect(wordsIn(n, 'en')).toBe(words);
  });

  it.each([
    [7, 'seitse'],
    [15, 'viisteist'],
    [40, 'nelikümmend'],
    [47, 'nelikümmend seitse'],
    [91, 'üheksakümmend üks'],
  ])('Estonian %i → %s', (n, words) => {
    expect(wordsIn(n, 'et')).toBe(words);
  });

  it.each([
    [7, 'septiņi'],
    [15, 'piecpadsmit'],
    [40, 'četrdesmit'],
    [47, 'četrdesmit septiņi'],
    [91, 'deviņdesmit viens'],
  ])('Latvian %i → %s', (n, words) => {
    expect(wordsIn(n, 'lv')).toBe(words);
  });

  it('rejects numbers outside 0–99', () => {
    expect(() => wordsIn(100, 'en')).toThrow(RangeError);
    expect(() => wordsIn(-1, 'et')).toThrow(RangeError);
  });
});

describe('switching language', () => {
  it('changes the words, and nested parts kept by other modules stay current', () => {
    const card = strings.card;
    setLanguage('et');
    expect(strings.home).toBe('Kodu');
    expect(card.follow).toBe('Jälgi');
    expect(thingName('cake')).toBe('Kook');
    expect(numberToWords(47)).toBe('nelikümmend seitse');
    setLanguage('lv');
    expect(card.follow).toBe('Sekot');
    expect(strings.onboarding.hooray('Pim')).toBe('Urrā, Pim!');
    setLanguage('en');
    expect(card.follow).toBe('Follow');
  });

  it('every language has every label (and no empty ones)', () => {
    const keys = (o: unknown, prefix = ''): string[] =>
      typeof o === 'object' && o !== null && !Array.isArray(o)
        ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
        : [prefix];
    const empty = (o: unknown): boolean =>
      typeof o === 'string'
        ? o.trim() === ''
        : typeof o === 'object' && o !== null && Object.values(o).some(empty);
    for (const dict of [et, lv]) {
      expect(keys(dict).toSorted()).toEqual(keys(en).toSorted());
      expect(empty(dict)).toBe(false);
    }
  });
});
