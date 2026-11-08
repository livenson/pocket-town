// The ten traits (docs/SIM.md → Traits). Each bot has three.
import type { IconName } from '../design/icons';
import type { NeedKey } from './tuning';
import type { ActivityId } from './activities';

export type TraitId =
  | 'snacky'
  | 'sleepy'
  | 'chatty'
  | 'musical'
  | 'explorer'
  | 'tidy'
  | 'brave'
  | 'gardener'
  | 'sporty'
  | 'shy';

export interface TraitDef {
  id: TraitId;
  icon: IconName;
  label: string;
  /** Multipliers on need decay. */
  decay?: Partial<Record<NeedKey, number>>;
  /** Multipliers on activity scores. */
  activity?: Partial<Record<ActivityId, number>>;
  /** Multiplier on going to other buildings. */
  otherBuilding?: number;
  /** Multiplier on the novelty bonus (brave bots try new things first). */
  novelty?: number;
}

export const traits: Record<TraitId, TraitDef> = {
  snacky: {
    id: 'snacky',
    icon: 'fork',
    label: 'Snacky',
    decay: { hunger: 1.4 },
    activity: { eat: 1.3, shop: 1.2 },
  },
  sleepy: {
    id: 'sleepy',
    icon: 'zzz',
    label: 'Sleepy',
    decay: { energy: 1.3 },
    activity: { nap: 1.4, sleep: 1.2 },
  },
  chatty: {
    id: 'chatty',
    icon: 'talk',
    label: 'Chatty',
    decay: { social: 1.5 },
    activity: { chat: 1.4, visit: 1.2, shop: 1.2 },
  },
  musical: { id: 'musical', icon: 'note', label: 'Musical', activity: { music: 1.6 } },
  explorer: {
    id: 'explorer',
    icon: 'map',
    label: 'Explorer',
    otherBuilding: 1.5,
    activity: { planes: 1.4 },
  },
  tidy: { id: 'tidy', icon: 'sparkle', label: 'Tidy', activity: { tidy: 1.5, tinker: 1.3 } },
  brave: {
    id: 'brave',
    icon: 'star',
    label: 'Brave',
    novelty: 1.6,
    activity: { checkup: 1.4, planes: 1.2 },
  },
  gardener: { id: 'gardener', icon: 'plant', label: 'Gardener', activity: { garden: 1.5 } },
  sporty: {
    id: 'sporty',
    icon: 'ball',
    label: 'Sporty',
    decay: { energy: 1.1 },
    activity: { play: 1.5, tinker: 1.2 },
  },
  shy: {
    id: 'shy',
    icon: 'eye',
    label: 'Shy',
    decay: { social: 0.6 },
    activity: { chat: 0.7, visit: 0.7 },
  },
};
