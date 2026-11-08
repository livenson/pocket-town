// What each activity looks like (icon, colour) and what things offer it.
import type { AnyIconName } from '../design/foodIcons';
import { color } from '../design/tokens';
import type { NeedKey } from './tuning';

export type ActivityId =
  | 'eat'
  | 'nap'
  | 'sleep'
  | 'play'
  | 'music'
  | 'read'
  | 'chat'
  | 'visit'
  | 'garden'
  | 'tidy'
  | 'wander'
  | 'wait'
  | 'goHome'
  // Town places (owner's request): the hospital, the workshop, the shop, the airport.
  | 'checkup'
  | 'tinker'
  | 'shop'
  | 'planes'
  // On the toilet with a little phone game (owner's request).
  | 'phone';

export interface ActivityLook {
  icon: AnyIconName | null;
  /** Icon colour on the white bubble (text-safe on light grounds). */
  color: string;
  /** How the character moves while doing it. */
  pose: 'idle' | 'sleep' | 'dance';
}

export const activityLook: Record<ActivityId, ActivityLook> = {
  eat: { icon: 'fork', color: color.tomatoText, pose: 'idle' },
  nap: { icon: 'zzz', color: color.cornflowerShadow, pose: 'sleep' },
  sleep: { icon: 'zzz', color: color.cornflowerShadow, pose: 'sleep' },
  play: { icon: 'ball', color: color.marigoldShadow, pose: 'dance' },
  music: { icon: 'note', color: color.purple, pose: 'dance' },
  read: { icon: 'book', color: color.cornflowerShadow, pose: 'idle' },
  chat: { icon: 'talk', color: color.tealDark, pose: 'idle' },
  visit: { icon: 'bell', color: color.ink, pose: 'idle' },
  garden: { icon: 'plant', color: color.tree, pose: 'idle' },
  tidy: { icon: 'sparkle', color: color.marigoldShadow, pose: 'idle' },
  wander: { icon: null, color: color.ink, pose: 'idle' },
  wait: { icon: 'target', color: color.ink, pose: 'idle' },
  goHome: { icon: 'home', color: color.ink, pose: 'idle' },
  checkup: { icon: 'plaster', color: color.heart, pose: 'idle' },
  tinker: { icon: 'wrench', color: color.tealDark, pose: 'idle' },
  shop: { icon: 'basket', color: color.tomatoText, pose: 'idle' },
  planes: { icon: 'plane', color: color.cornflowerShadow, pose: 'dance' },
  phone: { icon: 'phone', color: color.purple, pose: 'idle' },
};

/** The six nudge ideas the child can pick (SIM.md → influence ladder). */
export const nudgeIdeas: ActivityId[] = ['eat', 'nap', 'play', 'read', 'chat', 'tidy'];

export interface AdTemplate {
  activity: ActivityId;
  /** Need gained over the whole activity. */
  gains: Partial<Record<NeedKey, number>>;
  /** Game minutes. */
  duration: number;
  capacity: number;
}

/** Things that offer activities, by furniture or object kind. */
export const offers: Record<string, AdTemplate[]> = {
  table: [{ activity: 'eat', gains: { hunger: 55 }, duration: 30, capacity: 2 }],
  stove: [{ activity: 'eat', gains: { hunger: 45 }, duration: 35, capacity: 1 }],
  counter: [{ activity: 'eat', gains: { hunger: 60, social: 10 }, duration: 30, capacity: 3 }],
  cafeTable: [{ activity: 'eat', gains: { hunger: 50, social: 15 }, duration: 35, capacity: 2 }],
  plate: [{ activity: 'eat', gains: { hunger: 50 }, duration: 25, capacity: 1 }],
  sofa: [{ activity: 'nap', gains: { energy: 30 }, duration: 45, capacity: 2 }],
  bed: [{ activity: 'sleep', gains: { energy: 0 }, duration: 240, capacity: 2 }],
  musicBox: [{ activity: 'music', gains: { fun: 40 }, duration: 30, capacity: 2 }],
  piano: [{ activity: 'music', gains: { fun: 50, social: 10 }, duration: 40, capacity: 3 }],
  bookshelf: [{ activity: 'read', gains: { fun: 35 }, duration: 40, capacity: 2 }],
  toyBox: [{ activity: 'play', gains: { fun: 40 }, duration: 30, capacity: 2 }],
  ball: [{ activity: 'play', gains: { fun: 40 }, duration: 25, capacity: 2 }],
  swing: [{ activity: 'play', gains: { fun: 50 }, duration: 30, capacity: 2 }],
  gardenBed: [{ activity: 'garden', gains: { fun: 35 }, duration: 40, capacity: 2 }],
  pottedPlant: [{ activity: 'garden', gains: { fun: 25 }, duration: 20, capacity: 1 }],
  plant: [{ activity: 'garden', gains: { fun: 25 }, duration: 20, capacity: 1 }],
  bench: [{ activity: 'nap', gains: { energy: 20 }, duration: 30, capacity: 2 }],
  cakeStand: [{ activity: 'eat', gains: { hunger: 50 }, duration: 25, capacity: 2 }],
  armchair: [{ activity: 'nap', gains: { energy: 25 }, duration: 35, capacity: 1 }],
  beanbag: [{ activity: 'nap', gains: { energy: 25 }, duration: 35, capacity: 1 }],
  desk: [{ activity: 'read', gains: { fun: 30 }, duration: 35, capacity: 1 }],
  fridge: [{ activity: 'eat', gains: { hunger: 40 }, duration: 20, capacity: 1 }],
  bunkBed: [{ activity: 'sleep', gains: { energy: 0 }, duration: 240, capacity: 2 }],
  cot: [{ activity: 'sleep', gains: { energy: 0 }, duration: 240, capacity: 1 }],
  tv: [{ activity: 'play', gains: { fun: 35 }, duration: 40, capacity: 3 }],
  dollhouse: [{ activity: 'play', gains: { fun: 40 }, duration: 30, capacity: 2 }],
  rockingHorse: [{ activity: 'play', gains: { fun: 40 }, duration: 25, capacity: 1 }],
  playTent: [{ activity: 'play', gains: { fun: 40, social: 10 }, duration: 30, capacity: 2 }],
  drumKit: [{ activity: 'music', gains: { fun: 45 }, duration: 30, capacity: 1 }],
  flowerPot: [{ activity: 'garden', gains: { fun: 25 }, duration: 20, capacity: 1 }],
  cactus: [{ activity: 'garden', gains: { fun: 20 }, duration: 15, capacity: 1 }],
  bush: [{ activity: 'garden', gains: { fun: 25 }, duration: 20, capacity: 1 }],
  bookPile: [{ activity: 'read', gains: { fun: 35 }, duration: 35, capacity: 1 }],

  // The hospital: a check-up perks you up; a ward bed is a quiet rest (never a night's
  // sleep: bots only sleep at home).
  receptionDesk: [{ activity: 'chat', gains: { social: 30 }, duration: 15, capacity: 2 }],
  examBed: [{ activity: 'checkup', gains: { energy: 30, social: 30 }, duration: 25, capacity: 1 }],
  hospitalBed: [{ activity: 'nap', gains: { energy: 30 }, duration: 45, capacity: 1 }],
  waitingChairs: [
    { activity: 'nap', gains: { energy: 15, social: 10 }, duration: 20, capacity: 3 },
  ],
  /** A doctor's kit the child put down: anyone can have a check-up there. */
  doctorKit: [
    { activity: 'checkup', gains: { energy: 20, social: 15 }, duration: 20, capacity: 1 },
  ],
  // The workshop: building and fixing things.
  workbench: [{ activity: 'tinker', gains: { fun: 60, social: 10 }, duration: 40, capacity: 2 }],
  carLift: [{ activity: 'tinker', gains: { fun: 60, social: 15 }, duration: 40, capacity: 2 }],
  woodPile: [{ activity: 'tinker', gains: { fun: 30 }, duration: 25, capacity: 1 }],
  /** Tools the child put down. */
  toolKit: [{ activity: 'tinker', gains: { fun: 40 }, duration: 30, capacity: 1 }],
  // The shop: browsing the shelves, filling a basket, a chat at the till.
  shopShelf: [{ activity: 'shop', gains: { fun: 40, social: 35 }, duration: 25, capacity: 2 }],
  fruitStand: [
    { activity: 'shop', gains: { hunger: 35, fun: 15, social: 10 }, duration: 25, capacity: 2 },
  ],
  till: [{ activity: 'shop', gains: { social: 35, fun: 10 }, duration: 15, capacity: 2 }],
  /** Shopping the child put down. */
  shopping: [{ activity: 'shop', gains: { fun: 25, social: 10 }, duration: 20, capacity: 1 }],
  // The airport: watching the planes, playing pilot, waiting at the gate.
  bigWindow: [{ activity: 'planes', gains: { fun: 50 }, duration: 30, capacity: 3 }],
  // The bathroom: sitting on the toilet with a phone game.
  toilet: [{ activity: 'phone', gains: { fun: 35 }, duration: 20, capacity: 1 }],
  gateSeats: [
    { activity: 'planes', gains: { fun: 30, energy: 15, social: 10 }, duration: 30, capacity: 3 },
  ],
  plane: [{ activity: 'planes', gains: { fun: 60, social: 15 }, duration: 35, capacity: 3 }],
  checkInDesk: [{ activity: 'chat', gains: { social: 30 }, duration: 15, capacity: 2 }],
  /** A toy plane or a suitcase the child put down. */
  trip: [{ activity: 'planes', gains: { fun: 35 }, duration: 25, capacity: 1 }],
};

/** What a visit offers (any house that is not the bot's home). */
export const visitOffer: AdTemplate = {
  activity: 'visit',
  gains: { social: 55, fun: 10 },
  duration: 90,
  capacity: 3,
};
/** Chatting with another bot. */
export const chatOffer: AdTemplate = {
  activity: 'chat',
  gains: { social: 40, fun: 10 },
  duration: 25,
  capacity: 1,
};
/** Tidying a thing a bot left out. */
export const tidyOffer: AdTemplate = {
  activity: 'tidy',
  gains: { fun: 15 },
  duration: 10,
  capacity: 1,
};

/** The object kind a bot wishes for when a need cannot be met. */
export const wishFor: Record<NeedKey, string> = {
  hunger: 'cake',
  energy: 'pillow',
  fun: 'ball',
  social: 'heartCandy',
};
