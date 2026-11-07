// Numbers 0–99 in words, per language (the parental gate writes its number this way).
import type { Language } from './languages';

const EN_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

const ET_ONES = [
  'null',
  'üks',
  'kaks',
  'kolm',
  'neli',
  'viis',
  'kuus',
  'seitse',
  'kaheksa',
  'üheksa',
  'kümme',
  'üksteist',
  'kaksteist',
  'kolmteist',
  'neliteist',
  'viisteist',
  'kuusteist',
  'seitseteist',
  'kaheksateist',
  'üheksateist',
];
const ET_TENS = [
  '',
  '',
  'kakskümmend',
  'kolmkümmend',
  'nelikümmend',
  'viiskümmend',
  'kuuskümmend',
  'seitsekümmend',
  'kaheksakümmend',
  'üheksakümmend',
];

const LV_ONES = [
  'nulle',
  'viens',
  'divi',
  'trīs',
  'četri',
  'pieci',
  'seši',
  'septiņi',
  'astoņi',
  'deviņi',
  'desmit',
  'vienpadsmit',
  'divpadsmit',
  'trīspadsmit',
  'četrpadsmit',
  'piecpadsmit',
  'sešpadsmit',
  'septiņpadsmit',
  'astoņpadsmit',
  'deviņpadsmit',
];
const LV_TENS = [
  '',
  '',
  'divdesmit',
  'trīsdesmit',
  'četrdesmit',
  'piecdesmit',
  'sešdesmit',
  'septiņdesmit',
  'astoņdesmit',
  'deviņdesmit',
];

const TABLES: Record<Language, { ones: string[]; tens: string[]; join: string }> = {
  en: { ones: EN_ONES, tens: EN_TENS, join: '-' }, // forty-seven
  et: { ones: ET_ONES, tens: ET_TENS, join: ' ' }, // nelikümmend seitse
  lv: { ones: LV_ONES, tens: LV_TENS, join: ' ' }, // četrdesmit septiņi
};

/** 0–99 in words, e.g. 47 → "forty-seven" / "nelikümmend seitse" / "četrdesmit septiņi". */
export function numberToWords(n: number, language: Language = 'en'): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new RangeError(`Out of range: ${n}`);
  const t = TABLES[language];
  if (n < 20) return t.ones[n] ?? '';
  const tens = t.tens[Math.floor(n / 10)] ?? '';
  const ones = n % 10;
  return ones === 0 ? tens : `${tens}${t.join}${t.ones[ones] ?? ''}`;
}
