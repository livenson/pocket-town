import { icons, type IconName } from './icons';

/** Every icon name, in the order defined in icons.ts. */
export const iconNames: IconName[] = Object.keys(icons).filter((n): n is IconName => n in icons);
