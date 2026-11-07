// What a peg-folk character looks like (DESIGN.md → Peg-folk). No gender step:
// every option mixes freely.

export type HairStyle = 'bob' | 'puff' | 'bun' | 'crop' | 'none';
export type Eyes = 'open' | 'sleep' | 'wow';
export type Aid = 'none' | 'wheelchair' | 'hearing' | 'arm';

export type BodyShape = 'tall' | 'mid' | 'short';
export type Mouth = 'smile' | 'grin' | 'calm';
export type Pattern = 'plain' | 'stripes' | 'dots' | 'collar';
export type Accessory = 'none' | 'glasses' | 'bow' | 'hat';

export interface Appearance {
  skin: string;
  outfit: string;
  hair: string;
  hairStyle: HairStyle;
  aid: Aid;
  /** Optional extras from the avatar wizard (older saves simply lack them). */
  shape?: BodyShape;
  mouth?: Mouth;
  pattern?: Pattern;
  accessory?: Accessory;
  /** Colour for patterns and accessories. */
  accent?: string;
}

/** Height of each body shape relative to the middle one. */
export const shapeScale: Record<BodyShape, number> = { tall: 1.1, mid: 1, short: 0.88 };
