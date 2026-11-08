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
  /** Advanced face (the wizard's "more" mode, or a photo). All optional. */
  face?: FaceDetail;
  /** Second clothes colour: trousers, shorts, dungarees and cape. */
  second?: string;
}

export type FaceShape = 'round' | 'oval' | 'wide' | 'heart' | 'square' | 'pear';
export type EyeStyle = 'dots' | 'round' | 'almond';
export type Brows = 'none' | 'thin' | 'thick' | 'arched';
export type Nose = 'none' | 'dot' | 'button' | 'long';
export type Fringe = 'none' | 'straight' | 'side';
export type Beard = 'none' | 'stubble' | 'moustache' | 'short' | 'full';
/** Play tattoos (stickers), on the arm or the cheek. */
export type Tattoo = 'none' | 'heart' | 'star' | 'anchor' | 'bolt' | 'flower';
export type TattooPlace = 'arm' | 'cheek';

/**
 * Fine detail for a face that looks like someone in particular. Sizes are
 * multipliers around 1 (the classic peg face).
 */
export interface FaceDetail {
  shape?: FaceShape;
  eyes?: EyeStyle;
  eyeColour?: string;
  /** 0.8 (small) to 1.3 (big). */
  eyeSize?: number;
  /** 0.85 (close) to 1.15 (far apart). */
  eyeGap?: number;
  brows?: Brows;
  nose?: Nose;
  /** 0.7 (narrow) to 1.4 (wide). */
  mouthWidth?: number;
  ears?: boolean;
  fringe?: Fringe;
  /** Rosy cheeks; on unless turned off. */
  blush?: boolean;
  /** Beard and moustache, in the hair colour. */
  beard?: Beard;
  tattoo?: Tattoo;
  tattooPlace?: TattooPlace;
  tattooColour?: string;
}

/** Keep advanced sizes in their allowed ranges (photos and old saves alike). */
export const FACE_LIMITS = {
  eyeSize: [0.8, 1.3],
  eyeGap: [0.85, 1.15],
  mouthWidth: [0.7, 1.4],
} as const;

const clampTo = (v: number | undefined, [lo, hi]: readonly [number, number]) =>
  v === undefined || !Number.isFinite(v) ? undefined : Math.min(hi, Math.max(lo, v));

export function clampFace(f: FaceDetail): FaceDetail {
  const c = clampTo;
  return {
    ...f,
    eyeSize: c(f.eyeSize, FACE_LIMITS.eyeSize),
    eyeGap: c(f.eyeGap, FACE_LIMITS.eyeGap),
    mouthWidth: c(f.mouthWidth, FACE_LIMITS.mouthWidth),
  };
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
