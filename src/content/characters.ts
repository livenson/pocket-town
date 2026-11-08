// The starter cast (design-reference/Main.dc.html and Room.dc.html).
import { color } from '../design/tokens';
import type { Appearance } from './appearance';
import type { TraitId } from './traits';

export interface CharacterDef {
  id: string;
  name: string;
  appearance: Appearance;
  traits: [TraitId, TraitId, TraitId];
  homeId: string;
}

export const starterCast: CharacterDef[] = [
  {
    id: 'moku',
    name: 'Moku',
    appearance: {
      figure: 'girl',
      clothes: 'dress',
      skin: '#E9B48A',
      outfit: color.tomato,
      hair: color.ink,
      hairStyle: 'bob',
    },
    traits: ['snacky', 'chatty', 'tidy'],
    homeId: 'home',
  },
  {
    id: 'pim',
    name: 'Pim',
    appearance: {
      figure: 'boy',
      clothes: 'overalls',
      skin: '#8D5A3B',
      outfit: color.marigold,
      hair: color.ink,
      hairStyle: 'puff',
    },
    traits: ['musical', 'sporty', 'brave'],
    homeId: 'home',
  },
  {
    id: 'lumo',
    name: 'Lumo',
    appearance: {
      figure: 'girl',
      clothes: 'pants',
      second: color.teal,
      skin: '#C98E62',
      outfit: color.cornflower,
      hair: '#5A2E1A',
      hairStyle: 'bun',
    },
    traits: ['chatty', 'gardener', 'sleepy'],
    homeId: 'neighbour',
  },
  {
    id: 'nella',
    name: 'Nella',
    appearance: {
      figure: 'girl',
      clothes: 'cape',
      skin: '#5A3725',
      outfit: color.blossom,
      hair: color.marigold,
      hairStyle: 'bob',
    },
    traits: ['explorer', 'musical', 'shy'],
    homeId: 'neighbour',
  },
  {
    id: 'oki',
    name: 'Oki',
    appearance: {
      figure: 'boy',
      clothes: 'shorts',
      skin: '#F6D2B4',
      outfit: color.leaf,
      hair: color.ink,
      hairStyle: 'none',
    },
    traits: ['sleepy', 'gardener', 'shy'],
    homeId: 'home',
  },
  {
    id: 'tavi',
    name: 'Tavi',
    appearance: {
      figure: 'boy',
      clothes: 'space',
      skin: '#F6D2B4',
      outfit: color.marigold,
      hair: '#C2552B',
      hairStyle: 'crop',
    },
    traits: ['sporty', 'explorer', 'snacky'],
    homeId: 'home',
  },
];
