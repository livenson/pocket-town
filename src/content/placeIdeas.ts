// Where things belong, and what happens when the child puts them there: food on a
// table becomes a meal together, an instrument by the piano starts a jam, party
// things on a table start a party, a book in bed is a bedtime story. Pure data.
//
// A "moment" invites the characters in the room to join (they walk over and do the
// thing together, with a little extra joy), and the place shows a burst of hearts,
// notes, stars, petals or confetti. Nothing is required: anywhere else on the floor
// still works, and characters can use the thing later on their own.
import type { ActivityId } from './activities';
import type { NeedKey } from './tuning';

export type Moment =
  | 'feast'
  | 'birthday'
  | 'playtime'
  | 'cosy'
  | 'jam'
  | 'storytime'
  | 'bloom'
  | 'party'
  | 'nurse'
  | 'brush'
  | 'build'
  | 'trip'
  | 'shopping';

/** What a burst at the place is made of (DOM icons, see PlaceBurst). */
export type BurstKind = 'hearts' | 'notes' | 'stars' | 'petals' | 'confetti' | 'zzz' | 'bubbles';

export interface MomentDef {
  activity: ActivityId;
  /** Extra joy for everyone who joins, on top of what the thing gives. */
  bonus: Partial<Record<NeedKey, number>>;
  /** How many characters in the room are invited (the nearest first). */
  invite: number;
  /** Game minutes they spend on it. */
  minutes: number;
  burst: BurstKind;
}

export const moments: Record<Moment, MomentDef> = {
  feast: { activity: 'eat', bonus: { social: 20 }, invite: 3, minutes: 25, burst: 'hearts' },
  birthday: {
    activity: 'play',
    bonus: { social: 40, fun: 20 },
    invite: 6,
    minutes: 30,
    burst: 'confetti',
  },
  playtime: { activity: 'play', bonus: { social: 15 }, invite: 2, minutes: 25, burst: 'stars' },
  cosy: { activity: 'nap', bonus: { energy: 20 }, invite: 1, minutes: 30, burst: 'zzz' },
  jam: { activity: 'music', bonus: { social: 25 }, invite: 3, minutes: 25, burst: 'notes' },
  storytime: { activity: 'read', bonus: { social: 20 }, invite: 2, minutes: 25, burst: 'stars' },
  bloom: { activity: 'garden', bonus: { fun: 15 }, invite: 1, minutes: 20, burst: 'petals' },
  party: { activity: 'play', bonus: { social: 30 }, invite: 4, minutes: 25, burst: 'confetti' },
  nurse: { activity: 'checkup', bonus: { energy: 15 }, invite: 1, minutes: 20, burst: 'hearts' },
  brush: { activity: 'tidy', bonus: { energy: 10 }, invite: 1, minutes: 10, burst: 'bubbles' },
  build: { activity: 'tinker', bonus: { social: 15 }, invite: 2, minutes: 25, burst: 'stars' },
  trip: { activity: 'planes', bonus: { social: 15 }, invite: 2, minutes: 25, burst: 'stars' },
  shopping: { activity: 'shop', bonus: { social: 15 }, invite: 2, minutes: 20, burst: 'hearts' },
};

interface PlaceIdea {
  /** Pieces it is especially good on or by. */
  places: readonly string[];
  moment: Moment;
}

const TABLES = ['table', 'sideTable', 'cafeTable', 'counter', 'cakeStand', 'desk'] as const;
const BEDS = ['bed', 'bunkBed', 'cot', 'hospitalBed'] as const;
const SEATS = ['sofa', 'armchair', 'beanbag', 'bench'] as const;

const byCategory: Record<string, PlaceIdea> = {
  food: { places: [...TABLES, 'stove', 'fridge', 'fruitStand'], moment: 'feast' },
  toys: {
    places: ['toyBox', 'rug', 'roundRug', 'stripeRug', 'playTent', 'dollhouse', 'swing'],
    moment: 'playtime',
  },
  music: { places: ['piano', 'musicBox', 'drumKit', 'stagePlatform'], moment: 'jam' },
  books: {
    places: ['bookshelf', 'desk', 'bookPile', 'armchair', 'beanbag', ...BEDS],
    moment: 'storytime',
  },
  plants: {
    places: ['window', 'bigWindow', 'gardenBed', 'flowerPot', 'sideTable', 'table', 'shelf'],
    moment: 'bloom',
  },
  party: {
    places: [...TABLES, 'stagePlatform', 'fireplace', 'bunting'],
    moment: 'party',
  },
  care: {
    places: ['examBed', 'hospitalBed', 'medCabinet', 'receptionDesk'],
    moment: 'nurse',
  },
  tools: { places: ['carLift', 'toolWall', 'woodPile', 'workbench'], moment: 'build' },
  trips: {
    places: ['bigWindow', 'gateSeats', 'checkInDesk', 'plane', 'luggageCart'],
    moment: 'trip',
  },
};

/** Things with ideas of their own. */
const byKind: Record<string, PlaceIdea> = {
  birthdayCake: { places: [...TABLES], moment: 'birthday' },
  candle: { places: [...TABLES, 'fireplace'], moment: 'birthday' },
  pillow: { places: [...BEDS, ...SEATS], moment: 'cosy' },
  teddy: { places: [...BEDS, ...SEATS, 'toyBox', 'playTent'], moment: 'cosy' },
  toothbrush: { places: ['sink', 'bathtub'], moment: 'brush' },
  bouquet: { places: [...TABLES, 'window'], moment: 'party' },
  basket: { places: ['shopShelf', 'till', 'fruitStand', 'basketStack'], moment: 'shopping' },
  shoppingBags: { places: ['shopShelf', 'till', 'fruitStand'], moment: 'shopping' },
  shoppingCart: { places: ['shopShelf', 'till', 'fruitStand', 'basketStack'], moment: 'shopping' },
  // Made at the workbench.
  birdhouse: { places: ['window', 'gardenBed', 'tree', 'bush'], moment: 'bloom' },
  woodChair: { places: [...TABLES, 'fireplace'], moment: 'cosy' },
  clock: { places: ['shelf', 'fireplace', 'desk', 'sideTable'], moment: 'playtime' },
};

/** The place idea for a thing of this kind in this category. */
export function placeIdea(kind: string, category: string | undefined): PlaceIdea | null {
  return byKind[kind] ?? (category ? byCategory[category] : undefined) ?? null;
}

/** Every piece named as a place for something (checked against the furniture in tests). */
export const allPlaceKinds = (): string[] => [
  ...new Set(
    [...Object.values(byCategory), ...Object.values(byKind)].flatMap((idea) => idea.places),
  ),
];
