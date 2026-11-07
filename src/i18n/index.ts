// The text in use right now. `strings` is one live object: switching language
// copies the new words into it (nested objects keep their identity), so modules
// that keep a reference such as `strings.card` stay current.
import { en, type Strings } from './strings.en';
import { et } from './strings.et';
import { lv } from './strings.lv';
import { numberToWords as wordsFor } from './numbers';
import { deviceLanguage, type Language } from './languages';

export type { Language, Strings };
export { LANGUAGES, deviceLanguage } from './languages';

const DICTIONARIES: Record<Language, Strings> = { en, et, lv };

export const strings: Strings = structuredCloneDeep(en);
let current: Language = 'en';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * A deep copy that keeps functions (structuredClone cannot copy them). The copy has
 * exactly the shape of its input, which TypeScript cannot see through the recursion.
 */
function structuredCloneDeep<T>(v: T): T {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- same shape as the input
  if (Array.isArray(v)) return v.map((x: unknown) => structuredCloneDeep(x)) as T;
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = structuredCloneDeep(x);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- same shape as the input
    return out as T;
  }
  return v;
}

function assignDeep(target: object, source: object): void {
  for (const [k, v] of Object.entries(source)) {
    const t: unknown = Reflect.get(target, k);
    if (isPlainObject(t) && isPlainObject(v)) {
      for (const old of Object.keys(t)) if (!(old in v)) Reflect.deleteProperty(t, old);
      assignDeep(t, v);
    } else {
      Reflect.set(target, k, structuredCloneDeep(v));
    }
  }
}

export function setLanguage(language: Language): void {
  current = language;
  assignDeep(strings, DICTIONARIES[language]);
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

export function currentLanguage(): Language {
  return current;
}

/** Pick the language from the setting ('auto' follows the device). */
export function applyLanguageSetting(setting: Language | 'auto'): void {
  setLanguage(setting === 'auto' ? deviceLanguage() : setting);
}

export function numberToWords(n: number): string {
  return wordsFor(n, current);
}

/** Names of content (drawer things, traits, buildings) in the current language. */
export const thingName = (kind: string): string => strings.objects[kind] ?? kind;
export const traitName = (id: string): string => strings.traits[id] ?? id;
export const buildingName = (id: string): string =>
  strings.buildings[id] ??
  (/-?h(\d+)$/.exec(id) ? strings.house.name(Number(/h(\d+)$/.exec(id)?.[1])) : id);
