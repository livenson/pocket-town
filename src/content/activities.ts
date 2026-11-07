// What each activity looks like (icon, colour) and what things offer it.
import type { IconName } from '../design/icons';
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
  | 'goHome';

export interface ActivityLook {
  icon: IconName | null;
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
