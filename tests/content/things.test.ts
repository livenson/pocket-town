import { describe, expect, it } from 'vitest';
import { categories, giveEffects, objectKinds, placedOffers } from '../../src/content/objects';
import { thingArt } from '../../src/design/thingArt';
import { setLanguage, strings } from '../../src/i18n';

describe('things in the drawer', () => {
  it('each has a picture, something it does and a place to be used', () => {
    const missing = objectKinds.flatMap((o) => [
      ...(thingArt[o.art] ? [] : [`picture ${o.id}`]),
      ...(giveEffects[o.id] ? [] : [`effect ${o.id}`]),
      ...(placedOffers[o.id] ? [] : [`offer ${o.id}`]),
      ...(categories.some((c) => c.id === o.category) ? [] : [`category ${o.id}`]),
    ]);
    expect(missing).toEqual([]);
    expect(new Set(objectKinds.map((o) => o.id)).size).toBe(objectKinds.length);
  });

  it('each has a name in every language', () => {
    const missing: string[] = [];
    for (const lang of ['en', 'et', 'lv'] as const) {
      setLanguage(lang);
      for (const o of objectKinds) if (!strings.objects[o.id]) missing.push(`${lang}: ${o.id}`);
      for (const c of categories) if (!strings[c.id]) missing.push(`${lang}: ${c.id}`);
    }
    setLanguage('en');
    expect(missing).toEqual([]);
  });
});
