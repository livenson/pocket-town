export type Language = 'en' | 'et' | 'lv';

export const LANGUAGES: { id: Language; name: string; speech: string }[] = [
  { id: 'en', name: 'English', speech: 'en' },
  { id: 'et', name: 'Eesti', speech: 'et' },
  { id: 'lv', name: 'Latviešu', speech: 'lv' },
];

/** The device language, if we have it; otherwise English. */
export function deviceLanguage(): Language {
  const list =
    typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const tag of list) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base === 'et' || base === 'lv' || base === 'en') return base;
  }
  return 'en';
}
