// The workbench: things the child puts on it are ordinary placed objects standing
// on its top. When they make something (content/crafting.ts), the materials are
// used up, the tools stay, and the new thing appears on the bench. Nothing new is
// saved: the bench's contents are the objects on it.
import { recipeFor, type Recipe } from '../content/crafting';
import { surfaceOf, type Surface } from '../content/furniture';
import { findRoom } from '../content/rooms';
import type { Bot, PlacedObject, World } from './types';
import { clampToFloor } from './world';

/** Put a thing on a workbench: a new one (from the drawer) or one already placed. */
export interface BenchPut {
  type: 'benchPut';
  roomId: string;
  benchId: string;
  kind: string;
  /** Room x along the bench top (kept on the bench). */
  x: number;
  /** Moving a thing already placed somewhere. */
  objectId?: string;
  /** Ids for a new thing and for what gets made (fixed by the history, for redo). */
  id?: string;
  resultId?: string;
}

/** A game day after being fixed, the car in the garage needs fixing again. */
export const CAR_SHINY_MINUTES = 1440;

/** Small things a bot tinkering at a bench sometimes leaves out. */
const BOT_MAKES = ['birdhouse', 'toyCar', 'clock', 'boat'];
/** A bot leaves at most this many made things lying about in one room. */
const BOT_MAKES_PER_ROOM = 1;
const BOT_MAKE_CHANCE = 0.2;

export function benchSurface(roomId: string, benchId: string): Surface | null {
  const f = findRoom(roomId)?.furniture.find((x) => x.id === benchId);
  return f?.kind === 'workbench' ? surfaceOf(f) : null;
}

function isOn(o: PlacedObject, roomId: string, s: Surface): boolean {
  return (
    o.place.roomId === roomId &&
    (o.raise ?? 0) > 0 &&
    Math.abs(o.place.y - clampToFloor(o.place.x, s.floorY).y) < 1 &&
    o.place.x >= s.x0 - 1 &&
    o.place.x <= s.x1 + 1
  );
}

/** The things standing on a workbench, in the order they were put there. */
export function onBench(world: World, roomId: string, benchId: string): PlacedObject[] {
  const s = benchSurface(roomId, benchId);
  return s ? world.objects.filter((o) => isOn(o, roomId, s)) : [];
}

/** Places along a bench top, so things stand side by side instead of in a heap. */
export const BENCH_SLOTS = 3;

/**
 * Where a thing put on the bench stands: the free place nearest `preferX` (where
 * the finger is), or `preferX` itself once every place is taken.
 */
export function benchSlotX(
  world: World,
  roomId: string,
  benchId: string,
  preferX: number,
  except?: string,
): number {
  const s = benchSurface(roomId, benchId);
  if (!s) return preferX;
  const here = onBench(world, roomId, benchId).filter((o) => o.id !== except);
  const step = (s.x1 - s.x0) / BENCH_SLOTS;
  const free = Array.from({ length: BENCH_SLOTS }, (_, i) => s.x0 + step * (i + 0.5)).filter(
    (x) => !here.some((o) => Math.abs(o.place.x - x) < step / 2),
  );
  free.sort((a, b) => Math.abs(a - preferX) - Math.abs(b - preferX));
  return free[0] ?? Math.min(s.x1, Math.max(s.x0, preferX));
}

/** What putting `kind` on the bench would make (for the UI's sound and sparkle). */
export function benchWouldMake(world: World, put: BenchPut): Recipe | null {
  const kinds = onBench(world, put.roomId, put.benchId)
    .filter((o) => o.id !== put.objectId)
    .map((o) => o.kind);
  return recipeFor([...kinds, put.kind]);
}

/** Apply a bench put: place or move the thing, then make something if it can. */
export function applyBenchPut(world: World, cmd: BenchPut): boolean {
  const s = benchSurface(cmd.roomId, cmd.benchId);
  const room = findRoom(cmd.roomId);
  if (!s || !room) return false;
  const x = Math.min(s.x1, Math.max(s.x0, cmd.x));
  const spot = clampToFloor(x, s.floorY);
  const place = { buildingId: room.buildingId, roomId: room.id, ...spot };
  const raise = Math.max(1, s.floorY - s.top);
  if (cmd.objectId) {
    const o = world.objects.find((v) => v.id === cmd.objectId);
    if (!o || o.kind !== cmd.kind) return false;
    o.place = place;
    o.raise = raise;
    o.placedBy = 'child';
    delete o.madeBy;
  } else {
    const id = cmd.id ?? `o${world.nextObjectId}`;
    if (world.objects.some((o) => o.id === id)) return false;
    bumpIds(world, id);
    world.objects.push({ id, kind: cmd.kind, place, placedBy: 'child', raise });
  }
  craft(world, cmd);
  return true;
}

function bumpIds(world: World, id: string): void {
  const n = Number(id.slice(1));
  world.nextObjectId = Math.max(
    world.nextObjectId,
    Number.isFinite(n) ? n + 1 : world.nextObjectId + 1,
  );
}

function craft(world: World, cmd: BenchPut): void {
  const here = onBench(world, cmd.roomId, cmd.benchId);
  const recipe = recipeFor(here.map((o) => o.kind));
  if (!recipe) return;
  // Use up one of each material, the oldest first; tools stay where they are.
  const used = new Set<string>();
  for (const m of recipe.materials) {
    const o = here.find((v) => v.kind === m && !used.has(v.id));
    if (o) used.add(o.id);
  }
  const first = here.find((o) => used.has(o.id)) ?? here[0];
  if (!first) return;
  world.objects = world.objects.filter((o) => !used.has(o.id));
  const id = cmd.resultId ?? `o${world.nextObjectId}`;
  if (world.objects.some((o) => o.id === id)) return;
  bumpIds(world, id);
  world.objects.push({
    id,
    kind: recipe.makes,
    place: { ...first.place },
    placedBy: 'child',
    raise: first.raise ?? 1,
  });
}

/**
 * A bot finished tinkering at a workbench: now and then it leaves a little thing it
 * made on the floor beside it. It never touches what is on the bench (the child's).
 */
export function botTinkered(world: World, bot: Bot, targetId: string | undefined): void {
  if (!targetId?.startsWith('furniture:')) return;
  const [, roomId = '', benchId = ''] = targetId.split(':');
  if (!benchSurface(roomId, benchId)) return;
  // A hash of the moment, not the world's random numbers: tinkering stays out of
  // every other choice the bots make.
  const roll = hash(`${bot.id}:${Math.round(world.minute)}`);
  if (roll % 1000 >= BOT_MAKE_CHANCE * 1000) return;
  const lying = world.objects.filter(
    (o) => o.place.roomId === roomId && o.placedBy === 'bot' && BOT_MAKES.includes(o.kind),
  );
  if (lying.length >= BOT_MAKES_PER_ROOM) return;
  const kind = BOT_MAKES[Math.floor(roll / 1000) % BOT_MAKES.length] ?? 'birdhouse';
  const spot = clampToFloor(bot.place.x + 60 * bot.facing, bot.place.y + 10);
  world.objects.push({
    id: `o${world.nextObjectId++}`,
    kind,
    place: { ...bot.place, x: spot.x, y: spot.y },
    placedBy: 'bot',
    madeBy: 'bot',
  });
}

/** A small string hash (FNV-1a), the same on every machine. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** The garage car is shiny for a game day after the child fixed it. */
export function carIsShiny(world: World, key: string): boolean {
  const at = world.fixedCars?.[key];
  return at !== undefined && world.minute - at < CAR_SHINY_MINUTES;
}
