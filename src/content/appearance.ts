// What a peg-folk character looks like (DESIGN.md → Peg-folk). No gender step:
// every option mixes freely.

export type HairStyle = 'bob' | 'puff' | 'bun' | 'crop' | 'long' | 'spiky' | 'pigtails' | 'none';
export type Eyes = 'open' | 'sleep' | 'wow';
/** A person, or an animal (ears, nose and whiskers on the same peg body). */
export type Kind = 'person' | 'cat' | 'dog' | 'bear' | 'bunny' | 'mouse';

export type BodyShape = 'tall' | 'mid' | 'short';
export type Mouth = 'smile' | 'grin' | 'calm';
export type Pattern = 'plain' | 'stripes' | 'dots' | 'collar' | 'heart' | 'star';
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
}

/** Height of each body shape relative to the middle one. */
export const shapeScale: Record<BodyShape, number> = { tall: 1.1, mid: 1, short: 0.88 };
