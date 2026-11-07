// Random looks and names for "surprise me" (the dice). Pure data and functions.
import { hairColors, outfitColors, skinTones } from '../design/tokens';
import type { Appearance, HairStyle, Kind } from './appearance';
import type { TraitId } from './traits';

export const hairStyles: HairStyle[] = [
  'bob',
  'puff',
  'bun',
  'crop',
  'long',
  'spiky',
  'pigtails',
  'none',
];
/** Every kind of character: the dice picks an animal about half the time. */
export const kinds: Kind[] = ['person', 'cat', 'dog', 'bear', 'bunny', 'mouse'];
const rollKinds: Kind[] = [
  'person',
  'person',
  'person',
  'person',
  'person',
  'cat',
  'dog',
  'bear',
  'bunny',
  'mouse',
];

/** Curated names: short, easy to say, from no particular language. */
/** Curated names: short, easy to say, from no particular language. The starter
 *  cast's names (Moku, Pim, Lumo, Tavi, Nella, Oki) are left out, so a new
 *  character never shares a name with someone already in town. */
export const names = [
  'Zeb',
  'Bobo',
  'Kiki',
  'Ziggy',
  'Mona',
  'Pip',
  'Tilo',
  'Suki',
  'Nomi',
  'Roo',
  'Bea',
  'Ivo',
  'Lula',
  'Fenn',
  'Doti',
  'Wim',
  'Ada',
  'Juno',
  'Sami',
  'Toto',
  'Lilu',
  'Rafa',
  'Eko',
  'Nuno',
] as const;

export const allTraits: TraitId[] = [
  'snacky',
  'sleepy',
  'chatty',
  'musical',
  'explorer',
  'tidy',
  'brave',
  'gardener',
  'sporty',
  'shy',
];

const pickOne = <T>(items: readonly T[], random: () => number): T => {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('empty list');
  return item;
};

export function randomLook(random: () => number = Math.random): Appearance {
  return {
    hairStyle: pickOne(hairStyles, random),
    outfit: pickOne(outfitColors, random),
    skin: pickOne(skinTones, random),
    hair: pickOne(hairColors, random),
    kind: pickOne(rollKinds, random),
  };
}

export function randomName(avoid?: string, random: () => number = Math.random): string {
  const name = pickOne(names, random);
  return name === avoid ? 'Bippa' : name;
}

export function randomTraits(random: () => number = Math.random): [TraitId, TraitId, TraitId] {
  const pool = [...allTraits];
  const out: TraitId[] = [];
  while (out.length < 3) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0] ?? 'brave');
  return [out[0] ?? 'brave', out[1] ?? 'chatty', out[2] ?? 'snacky'];
}
