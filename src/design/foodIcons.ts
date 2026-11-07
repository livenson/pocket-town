// More food for the object drawer, drawn in the same style as icons.ts (32×32,
// stroke only, round caps). Kept separate so the provided icon file stays as it was.
import { icons, type IconName } from './icons';

const C = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const D = (x: number, y: number) => C(x, y, 0.9);

export const foodIcons = {
  apple:
    'M16 10c-3-2-10-2-10 7 0 6 4 10 7 10 1 0 2-1 3-1s2 1 3 1c3 0 7-4 7-10 0-9-7-9-10-7z' +
    'M16 10c0-3 1-5 3-6M17 7c2-2 5-2 6 0-2 2-5 2-6 0z',
  pizza: 'M5 9c7-3 15-3 22 0L16 28zM6.5 12.5c6-2 13-2 19 0' + D(13, 16) + D(19, 16) + D(16, 21),
  iceCream: 'M10 14a6 6 0 1 1 12 0zM10 14l6 14 6-14M13 19l6 0',
  soup: 'M5 16h22a11 11 0 0 1-22 0zM12 12c-2-2 2-3 0-6M20 12c-2-2 2-3 0-6',
  cupcake: 'M9 17l2 10h10l2-10zM8 17c-1-6 4-9 8-9s9 3 8 9zM14 21v4M18 21v4' + C(16, 6, 1.6),
  watermelon: 'M5 13a11 11 0 0 0 22 0zM8 13a8 8 0 0 0 16 0' + D(12, 17) + D(16, 19) + D(20, 17),
};

export type FoodIconName = keyof typeof foodIcons;
/** Any icon the app can draw: the provided family plus the extra foods. */
export type AnyIconName = IconName | FoodIconName;

const isFood = (name: AnyIconName): name is FoodIconName => Object.hasOwn(foodIcons, name);

/** The SVG path for any icon, from whichever set it belongs to. */
export function iconPath(name: AnyIconName): string {
  return isFood(name) ? foodIcons[name] : icons[name];
}
