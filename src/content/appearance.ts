// What a peg-folk character looks like (DESIGN.md → Peg-folk). Boy or girl is an
// optional choice (owner's decision, see DECISIONS.md) that shapes the figure and
// face; every hair style, outfit and colour stays open to everyone.

export type HairStyle = 'bob' | 'puff' | 'bun' | 'crop' | 'long' | 'spiky' | 'pigtails' | 'none';
export type Eyes = 'open' | 'sleep' | 'wow';
/** A person, or an animal (ears, nose and whiskers on the same peg body). */
export type Kind = 'person' | 'cat' | 'dog' | 'bear' | 'bunny' | 'mouse';

export type BodyShape = 'tall' | 'mid' | 'short';
export type Mouth = 'smile' | 'grin' | 'calm';
export type Pattern = 'plain' | 'stripes' | 'dots' | 'collar' | 'heart' | 'star';
/** Shapes the figure (shoulders) and face (lashes). Missing: the original peg. */
export type Figure = 'boy' | 'girl';
/** What the character wears. Missing: the original felt tunic. */
export type Clothes = 'tunic' | 'dress' | 'pants' | 'shorts' | 'overalls' | 'space' | 'cape';
export type Accessory = 'none' | 'glasses' | 'bow' | 'hat' | 'headband' | 'flower' | 'crown';

export interface Appearance {
  skin: string;
  outfit: string;
  hair: string;
  hairStyle: HairStyle;
  /** Optional extras from the avatar wizard (older saves simply lack them). */
  shape?: BodyShape;
  mouth?: Mouth;
  pattern?: Pattern;
  accessory?: Accessory;
  freckles?: boolean;
  /** Missing means a person. Skin is the fur colour for animals. */
  kind?: Kind;
  /** Colour for patterns and accessories. */
  accent?: string;
  figure?: Figure;
  clothes?: Clothes;
  /** Second clothes colour: trousers, shorts, dungarees and cape. */
  second?: string;
}

/** Clothes that cover the legs, or a cape: these use the second colour. */
export const usesSecondColour: ReadonlySet<Clothes> = new Set<Clothes>([
  'pants',
  'shorts',
  'overalls',
  'cape',
]);

/** The trousers' colour when none was chosen: a friendly denim. */
export const DEFAULT_SECOND = '#3D5AA8';

/** Height of each body shape relative to the middle one. */
export const shapeScale: Record<BodyShape, number> = { tall: 1.1, mid: 1, short: 0.88 };
