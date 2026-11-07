// Random looks and names for "surprise me" (the dice). Pure data and functions.
import { hairColors, outfitColors, skinTones } from '../design/tokens';
import type { Aid, Appearance, HairStyle } from './appearance';
import type { TraitId } from './traits';

export const hairStyles: HairStyle[] = ['bob', 'puff', 'bun', 'crop', 'none'];
/** Helpers appear often enough to be ordinary, never as a special case. */
export const aids: Aid[] = ['none', 'none', 'none', 'wheelchair', 'hearing', 'arm'];

/** Curated names: short, easy to say, from no particular language. */
export const names = [
  'Moku',
  'Pim',
  'Lumo',
  'Tavi',
  'Nella',
  'Oki',
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
    aid: pickOne(aids, random),
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
