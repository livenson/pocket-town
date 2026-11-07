import { describe, expect, it } from 'vitest';
import { numberToWords } from '../../src/i18n/strings.en';

describe('numberToWords', () => {
  it.each([
    [0, 'zero'],
    [7, 'seven'],
    [13, 'thirteen'],
    [20, 'twenty'],
    [47, 'forty-seven'],
    [99, 'ninety-nine'],
  ])('%i → %s', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it('rejects numbers outside 0–99', () => {
    expect(() => numberToWords(100)).toThrow(RangeError);
    expect(() => numberToWords(-1)).toThrow(RangeError);
  });
});
