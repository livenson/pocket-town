// Rooms and the starter house's first room, from design-reference/Room.dc.html.
import { color } from '../design/tokens';
import type { FurnitureInstance } from './furniture';

export interface RoomDef {
  id: string;
  wall: string;
  /** Faint vertical stripes on the wallpaper. */
  stripe: string | null;
  floor: string;
  /** Optional faint divider where two room areas meet (x in room units). */
  dividerX: number | null;
  furniture: FurnitureInstance[];
}

export const starterRoom: RoomDef = {
  id: 'kitchen-living',
  wall: '#FFEFD9',
  stripe: color.tomato,
  floor: color.woodLight,
  dividerX: 420,
  furniture: [
    { id: 'door-1', kind: 'door', x: 30, y: 150 },
    { id: 'shelf-1', kind: 'shelf', x: 170, y: 20 },
    { id: 'stove-1', kind: 'stove', x: 160, y: 236 },
    { id: 'window-1', kind: 'window', x: 606, y: 52 },
    { id: 'rug-1', kind: 'rug', x: 600, y: 450 },
    { id: 'sofa-1', kind: 'sofa', x: 606, y: 300 },
    { id: 'table-1', kind: 'table', x: 260, y: 388 },
    { id: 'musicBox-1', kind: 'musicBox', x: 500, y: 400 },
  ],
};
