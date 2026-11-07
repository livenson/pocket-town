// Keep the building registry in step with the houses in the world.
import { buildingOf } from '../content/house';
import { setBuiltBuildings, setRoomEdits } from '../content/rooms';
import type { World } from './types';

let synced: unknown = null;
let syncedEdits: unknown = null;
/** One shared "nothing decorated", so an undefined field never looks like a change. */
const NO_EDITS = {};

/** Name for the n-th house the child built, in the current language (set by the app). */
let houseName: (n: number) => string = (n) => `House ${n}`;

export function setHouseNamer(fn: (n: number) => string): void {
  houseName = fn;
  synced = null;
}

/** Call after the world's houses or decorating change (cheap when nothing changed). */
export function syncHouses(world: World): void {
  const edits = world.roomEdits ?? NO_EDITS;
  if (edits !== syncedEdits) {
    syncedEdits = edits;
    setRoomEdits(edits);
  }
  const key = JSON.stringify(world.houses);
  if (key === synced) return;
  synced = key;
  setBuiltBuildings(
    world.houses
      .filter((h) => h.rooms.some(Boolean))
      .map((h) => buildingOf(h, houseName(h.number))),
  );
}
