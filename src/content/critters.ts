// Animals that wander about the world map. Tap one: it hops and shares an idea;
// some ideas lead to a place. Pure data (positions are 0–1 across and down the map).

export type CritterId = 'cat' | 'dog' | 'duck' | 'bird' | 'butterfly' | 'hedgehog';

export interface CritterDef {
  id: CritterId;
  /** Picture name in src/design/thingArt.ts. */
  art: string;
  /** Where it wanders: a box on the map. */
  zone: { x0: number; x1: number; y0: number; y1: number };
  /** Seconds to cross the map at full speed (smaller is quicker). */
  pace: number;
  size: number;
}

export const critters: CritterDef[] = [
  { id: 'cat', art: 'cat', zone: { x0: 0.08, x1: 0.42, y0: 0.42, y1: 0.58 }, pace: 18, size: 48 },
  { id: 'dog', art: 'dog', zone: { x0: 0.55, x1: 0.95, y0: 0.42, y1: 0.58 }, pace: 12, size: 52 },
  // The duck keeps to the pond (bottom left).
  { id: 'duck', art: 'duck', zone: { x0: 0.07, x1: 0.2, y0: 0.82, y1: 0.92 }, pace: 22, size: 40 },
  { id: 'bird', art: 'bird', zone: { x0: 0.3, x1: 0.95, y0: 0.08, y1: 0.3 }, pace: 8, size: 40 },
  {
    id: 'butterfly',
    art: 'butterfly',
    zone: { x0: 0.6, x1: 0.97, y0: 0.6, y1: 0.85 },
    pace: 14,
    size: 34,
  },
  {
    id: 'hedgehog',
    art: 'hedgehog',
    zone: { x0: 0.3, x1: 0.48, y0: 0.7, y1: 0.95 },
    pace: 30,
    size: 40,
  },
];

/** Ideas the animals share; `place` makes the bubble a way to go there. */
export const ideas: { key: string; place?: string }[] = [
  { key: 'fastest' },
  { key: 'ducks' },
  { key: 'clouds' },
  { key: 'dance' },
  { key: 'nap' },
  { key: 'hello' },
  { key: 'stick' },
  { key: 'secret' },
  { key: 'cake', place: 'cafe' },
  { key: 'park', place: 'park' },
  { key: 'story', place: 'library' },
  { key: 'music', place: 'musicHall' },
  { key: 'home', place: 'home' },
  { key: 'neighbours', place: 'neighbour' },
  { key: 'pond', place: 'park' },
];
