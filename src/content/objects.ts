// Things in the object drawer, by category. Pure data. Milestone M4 adds what each
// one does (eat, play, read...) and the needs it satisfies.
import type { IconName } from '../design/icons';
import type { ActivityId } from './activities';
import type { NeedKey } from './tuning';
import { color, roomColor } from '../design/tokens';

export type ObjectCategory = 'food' | 'toys' | 'music' | 'books' | 'plants';

export interface ObjectKind {
  id: string;
  category: ObjectCategory;
  icon: IconName;
  label: string;
  /** Tile background. */
  tint: string;
}

/** When given to a bot: the activity it does at once, and what it gains. */
export interface GiveEffect {
  activity: ActivityId;
  gains: Partial<Record<NeedKey, number>>;
}

const FOOD: GiveEffect = { activity: 'eat', gains: { hunger: 45 } };

/** What each kind does when given to a bot. */
export const giveEffects: Record<string, GiveEffect> = {
  cake: FOOD,
  starCookie: FOOD,
  salad: FOOD,
  heartCandy: { activity: 'eat', gains: { hunger: 20, social: 35 } },
  dinner: { activity: 'eat', gains: { hunger: 60 } },
  ball: { activity: 'play', gains: { fun: 45 } },
  blocks: { activity: 'play', gains: { fun: 40 } },
  pillow: { activity: 'nap', gains: { energy: 35 } },
  musicBox: { activity: 'music', gains: { fun: 45 } },
  drum: { activity: 'music', gains: { fun: 45 } },
  storybook: { activity: 'read', gains: { fun: 40 } },
  pottedPlant: { activity: 'garden', gains: { fun: 30 } },
  tree: { activity: 'garden', gains: { fun: 30 } },
};

/**
 * When placed in a room: which offer it advertises to bots (see activities.ts).
 * Placed food is a plate that never empties.
 */
export const placedOffers: Record<string, string> = {
  cake: 'plate',
  starCookie: 'plate',
  salad: 'plate',
  heartCandy: 'plate',
  dinner: 'plate',
  ball: 'ball',
  blocks: 'toyBox',
  pillow: 'sofa',
  musicBox: 'musicBox',
  drum: 'musicBox',
  storybook: 'bookshelf',
  pottedPlant: 'pottedPlant',
  tree: 'pottedPlant',
};

export const categories: { id: ObjectCategory; icon: IconName }[] = [
  { id: 'food', icon: 'fork' },
  { id: 'toys', icon: 'ball' },
  { id: 'music', icon: 'note' },
  { id: 'books', icon: 'book' },
  { id: 'plants', icon: 'plant' },
];

export const objectKinds: ObjectKind[] = [
  { id: 'cake', category: 'food', icon: 'cake', label: 'Cake', tint: color.peach },
  {
    id: 'starCookie',
    category: 'food',
    icon: 'star',
    label: 'Star cookie',
    tint: roomColor.kitchen,
  },
  { id: 'salad', category: 'food', icon: 'plant', label: 'Salad', tint: roomColor.play },
  {
    id: 'heartCandy',
    category: 'food',
    icon: 'heart',
    label: 'Heart candy',
    tint: roomColor.bedroom,
  },
  { id: 'dinner', category: 'food', icon: 'fork', label: 'Dinner plate', tint: roomColor.bath },
  { id: 'ball', category: 'toys', icon: 'ball', label: 'Ball', tint: roomColor.living },
  { id: 'blocks', category: 'toys', icon: 'grid4', label: 'Blocks', tint: roomColor.kitchen },
  { id: 'pillow', category: 'toys', icon: 'bed', label: 'Pillow', tint: roomColor.bath },
  { id: 'musicBox', category: 'music', icon: 'note', label: 'Music box', tint: roomColor.music },
  { id: 'drum', category: 'music', icon: 'wave', label: 'Drum', tint: color.peach },
  { id: 'storybook', category: 'books', icon: 'book', label: 'Storybook', tint: roomColor.bath },
  {
    id: 'pottedPlant',
    category: 'plants',
    icon: 'plant',
    label: 'Potted plant',
    tint: roomColor.play,
  },
  { id: 'tree', category: 'plants', icon: 'tree', label: 'Little tree', tint: roomColor.living },
];
