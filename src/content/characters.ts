// The starter cast (design-reference/Main.dc.html and Room.dc.html).
import { color } from '../design/tokens';
import type { Appearance } from './appearance';

export interface CharacterDef {
  id: string;
  name: string;
  appearance: Appearance;
}

export const starterCast: CharacterDef[] = [
  {
    id: 'moku',
    name: 'Moku',
    appearance: {
      skin: '#E9B48A',
      outfit: color.tomato,
      hair: color.ink,
      hairStyle: 'bob',
      aid: 'none',
    },
  },
  {
    id: 'pim',
    name: 'Pim',
    appearance: {
      skin: '#8D5A3B',
      outfit: color.marigold,
      hair: color.ink,
      hairStyle: 'puff',
      aid: 'none',
    },
  },
  {
    id: 'lumo',
    name: 'Lumo',
    appearance: {
      skin: '#C98E62',
      outfit: color.cornflower,
      hair: '#5A2E1A',
      hairStyle: 'bun',
      aid: 'hearing',
    },
  },
  {
    id: 'nella',
    name: 'Nella',
    appearance: {
      skin: '#5A3725',
      outfit: color.blossom,
      hair: color.marigold,
      hairStyle: 'bob',
      aid: 'arm',
    },
  },
  {
    id: 'oki',
    name: 'Oki',
    appearance: {
      skin: '#F6D2B4',
      outfit: color.leaf,
      hair: color.ink,
      hairStyle: 'none',
      aid: 'none',
    },
  },
  {
    id: 'tavi',
    name: 'Tavi',
    appearance: {
      skin: '#F6D2B4',
      outfit: color.marigold,
      hair: '#C2552B',
      hairStyle: 'crop',
      aid: 'wheelchair',
    },
  },
];
