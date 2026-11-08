// Animals that wander about the world map. Tap one: it hops and says what it thinks
// (src/content/critterThoughts.ts). Pure data (positions are 0–1 across and down the map).

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
  { id: 'cat', art: 'cat', zone: { x0: 0.04, x1: 0.34, y0: 0.36, y1: 0.44 }, pace: 18, size: 48 },
  { id: 'dog', art: 'dog', zone: { x0: 0.39, x1: 0.44, y0: 0.08, y1: 0.95 }, pace: 12, size: 52 },
  // The duck keeps to the pond (bottom left).
  { id: 'duck', art: 'duck', zone: { x0: 0.04, x1: 0.14, y0: 0.88, y1: 0.98 }, pace: 22, size: 40 },
  { id: 'bird', art: 'bird', zone: { x0: 0.3, x1: 0.95, y0: 0.0, y1: 0.12 }, pace: 8, size: 40 },
  {
    id: 'butterfly',
    art: 'butterfly',
    zone: { x0: 0.6, x1: 0.97, y0: 0.66, y1: 0.8 },
    pace: 14,
    size: 34,
  },
  {
    id: 'hedgehog',
    art: 'hedgehog',
    zone: { x0: 0.31, x1: 0.47, y0: 0.7, y1: 0.98 },
    pace: 30,
    size: 40,
  },
];
