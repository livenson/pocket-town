// Saving the town on the device: a versioned schema, migrations, and two slots
// written in turn so a broken save always leaves the previous good one.
import { get, set } from 'idb-keyval';
import type { World } from '../sim/types';

export const SAVE_SCHEMA = 2;
/** Saves made before profiles existed (and the test-only "no profile" town). */
const SLOTS = ['pocket-town:save:a', 'pocket-town:save:b'] as const;

/** Each player has their own town, in their own pair of slots. */
export function slotsFor(profileId: string | null): readonly [string, string] {
  return profileId ? [`pocket-town:save:${profileId}:a`, `pocket-town:save:${profileId}:b`] : SLOTS;
}

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
export const migrations: Record<number, Migration> = {
  // 1 → 2: the house wizard (M6) adds houses the child built.
  1: (old) => ({ ...old, world: isRecord(old.world) ? { houses: [], ...old.world } : old.world }),
};

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

const lastGeneration = new Map<string, number>();

/** Load the newest good save, or null if there is none. */
export async function loadSave(profileId: string | null = null): Promise<SaveFile | null> {
  const slots = slotsFor(profileId);
  const files: SaveFile[] = [];
  for (const slot of slots) {
    try {
      const file = parse(await get(slot));
      if (file) files.push(file);
    } catch {
      // Unreadable slot: try the other one.
    }
  }
  files.sort((a, b) => b.generation - a.generation);
  const best = files[0] ?? null;
  const key = slots[0];
  lastGeneration.set(
    key,
    Math.max(lastGeneration.get(key) ?? 0, ...files.map((f) => f.generation), 0),
  );
  return best;
}

/** Write a save into the older of the two slots. */
export async function writeSave(
  world: World,
  ui: SaveFile['ui'],
  profileId: string | null = null,
): Promise<void> {
  const slots = slotsFor(profileId);
  const generation = (lastGeneration.get(slots[0]) ?? 0) + 1;
  lastGeneration.set(slots[0], generation);
  const file: SaveFile = { schema: SAVE_SCHEMA, savedAt: Date.now(), generation, world, ui };
  await set(slots[generation % 2] ?? slots[0], JSON.stringify(file));
}

/** For tests: forget which generation was written last. */
export function resetSaveState(): void {
  lastGeneration.clear();
}

export { SLOTS as SAVE_SLOTS };
