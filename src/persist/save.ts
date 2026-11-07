// Saving the town on the device: a versioned schema, migrations, and two slots
// written in turn so a broken save always leaves the previous good one.
import { get, set } from 'idb-keyval';
import type { World } from '../sim/types';

export const SAVE_SCHEMA = 1;
const SLOTS = ['pocket-town:save:a', 'pocket-town:save:b'] as const;

export interface SaveFile {
  schema: number;
  savedAt: number;
  /** Increases with every write; the higher valid one wins. */
  generation: number;
  world: World;
  ui: { roomId: string };
}

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] turns a schema-n save into schema n+1. */
export const migrations: Record<number, Migration> = {};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** The shape checks in `migrate` have run; this tells TypeScript the result. */
function isSaveFile(data: Record<string, unknown>): data is Record<string, unknown> & SaveFile {
  return data.schema === SAVE_SCHEMA && isRecord(data.world) && isRecord(data.ui);
}

/** Bring an old save up to date and check it looks like a world. */
export function migrate(raw: unknown): SaveFile | null {
  if (!isRecord(raw) || typeof raw.schema !== 'number') return null;
  let data: Record<string, unknown> = raw;
  for (let v = raw.schema; v < SAVE_SCHEMA; v++) {
    const step = migrations[v];
    if (!step) return null;
    data = { ...step(data), schema: v + 1 };
  }
  if (data.schema !== SAVE_SCHEMA) return null;
  const world = data.world;
  if (!isRecord(world) || !Array.isArray(world.bots) || !Array.isArray(world.objects)) return null;
  if (typeof world.minute !== 'number' || !isRecord(world.rng)) return null;
  if (!isRecord(data.ui) || typeof data.ui.roomId !== 'string') return null;
  if (typeof data.generation !== 'number' || typeof data.savedAt !== 'number') return null;
  return isSaveFile(data) ? data : null;
}

function parse(text: unknown): SaveFile | null {
  if (typeof text !== 'string') return null;
  try {
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}

let lastGeneration = 0;

/** Load the newest good save, or null if there is none. */
export async function loadSave(): Promise<SaveFile | null> {
  const files: SaveFile[] = [];
  for (const slot of SLOTS) {
    try {
      const file = parse(await get(slot));
      if (file) files.push(file);
    } catch {
      // Unreadable slot: try the other one.
    }
  }
  files.sort((a, b) => b.generation - a.generation);
  const best = files[0] ?? null;
  lastGeneration = Math.max(lastGeneration, ...files.map((f) => f.generation), 0);
  return best;
}

/** Write a save into the older of the two slots. */
export async function writeSave(world: World, ui: SaveFile['ui']): Promise<void> {
  const generation = ++lastGeneration;
  const file: SaveFile = { schema: SAVE_SCHEMA, savedAt: Date.now(), generation, world, ui };
  const slot = SLOTS[generation % 2] ?? SLOTS[0];
  await set(slot, JSON.stringify(file));
}

/** For tests: forget which generation was written last. */
export function resetSaveState(): void {
  lastGeneration = 0;
}

export { SLOTS as SAVE_SLOTS };
