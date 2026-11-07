// Things in the object drawer, by category. Pure data. Milestone M4 adds what each
// one does (eat, play, read...) and the needs it satisfies.
import type { IconName } from '../design/icons';
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
