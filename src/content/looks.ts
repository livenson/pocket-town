// Random looks and names for "surprise me" (the dice). Pure data and functions.
import { hairColors, outfitColors, skinTones } from '../design/tokens';
import type { Appearance, Clothes, FaceDetail, Figure, HairStyle, Kind } from './appearance';
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

export const figures: Figure[] = ['boy', 'girl'];
export const clothesKinds: Clothes[] = [
  'tunic',
  'dress',
  'pants',
  'shorts',
  'overalls',
  'space',
  'cape',
];
/** Hair styles the dice and the boy/girl switch treat as typical. Every style
 *  stays open to everyone in the wizard. */
const typicalHair: Record<Figure, HairStyle[]> = {
  girl: ['long', 'pigtails', 'bun', 'bob', 'puff'],
  boy: ['crop', 'spiky', 'none', 'puff'],
};
const typicalClothes: Record<Figure, Clothes[]> = {
  girl: ['dress', 'dress', 'pants', 'shorts', 'overalls', 'space', 'cape', 'tunic'],
  boy: ['pants', 'pants', 'shorts', 'overalls', 'space', 'cape', 'tunic'],
};
/** Trousers, shorts, dungarees and capes: denim most often, sometimes a colour. */
const seconds = ['#3D5AA8', '#3D5AA8', '#2A1640', '#EF4B2F', '#0FA394', '#FF8FB1', '#FFB627'];

/**
 * Choose boy or girl. Hair and clothes that are typical of the other one change to
 * a typical one for this choice; anything else the child picked stays.
 */
export function withFigure(a: Appearance, figure: Figure): Appearance {
  const other: Figure = figure === 'boy' ? 'girl' : 'boy';
  const next: Appearance = { ...a, figure };
  const hair = typicalHair[other];
  if (hair.includes(a.hairStyle) && !typicalHair[figure].includes(a.hairStyle))
    next.hairStyle = figure === 'girl' ? 'long' : 'crop';
  if (figure === 'girl' && (a.clothes === undefined || a.clothes === 'tunic'))
    next.clothes = 'dress';
  if (
    figure === 'boy' &&
    (a.clothes === undefined || a.clothes === 'dress' || a.clothes === 'tunic')
  )
    next.clothes = 'pants';
  return next;
}

const eyeColours = ['#6B4A2E', '#3B2A1E', '#3D7BD9', '#3E8E4A', '#8A9A5B'];

/** A detailed face for new characters (no beards or tattoos: those are chosen). */
export function randomFace(random: () => number = Math.random): FaceDetail {
  return {
    eyes: pickOne(['round', 'round', 'almond'] as const, random),
    eyeColour: pickOne(eyeColours, random),
    brows: pickOne(['thin', 'thin', 'thick', 'arched'] as const, random),
    nose: pickOne(['button', 'button', 'dot'] as const, random),
    ears: true,
    shape: pickOne(['round', 'oval', 'wide', 'heart', 'square', 'pear'] as const, random),
  };
}

export function randomLook(random: () => number = Math.random): Appearance {
  const figure = pickOne(figures, random);
  return {
    face: randomFace(random),
    figure,
    hairStyle: pickOne(typicalHair[figure], random),
    outfit: pickOne(outfitColors, random),
    skin: pickOne(skinTones, random),
    hair: pickOne(hairColors, random),
    kind: pickOne(rollKinds, random),
    clothes: pickOne(typicalClothes[figure], random),
    second: pickOne(seconds, random),
  };
}

/** The dice in the clothes step: something typical for the figure (if chosen). */
export function randomClothes(
  figure: Figure | undefined,
  random: () => number = Math.random,
): Clothes {
  return pickOne(figure ? typicalClothes[figure] : clothesKinds, random);
}

export { seconds as secondColours };

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
