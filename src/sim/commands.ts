// What the child can do to the world (docs/SIM.md → The child's influence ladder).
// Every command is a plain object so it can be recorded, undone and replayed.
import type { ActivityId } from '../content/activities';
import type { Appearance } from '../content/appearance';
import { roomIdOf, type HouseDef } from '../content/house';
import type { TraitId } from '../content/traits';
import { giveEffects } from '../content/objects';
import {
  clampFurniture,
  fixedKinds,
  furnitureKinds,
  type FurnitureInstance,
} from '../content/furniture';
import { findBaseRoom, findBuilding, findRoom } from '../content/rooms';
import { syncHouses } from './houses';
import { tuning } from '../content/tuning';
import { emit, startGoHome, startVisit } from './step';
import type { Place, World } from './types';
import { clampToFloor, entryRoom, getBot, makeBot, routeTo } from './world';

export type Command =
  | { type: 'give'; botId: string; kind: string }
  | { type: 'nudge'; botId: string; activity: ActivityId }
  | { type: 'call'; botId: string; place: Place }
  | { type: 'control'; botId: string; on: boolean }
  | { type: 'puppetMove'; botId: string; place: Place }
  /** The child put this character here (dragged or tapped in from the dock). */
  | { type: 'bring'; botId: string; place: Place }
  | { type: 'freeze'; botId: string; on: boolean }
  | { type: 'sendHome'; botId: string }
  | { type: 'placeObject'; kind: string; place: Place; id?: string; raise?: number }
  | { type: 'moveObject'; id: string; place: Place; raise?: number }
  | { type: 'removeObject'; id: string }
  /** Create or change a house the child is building (the whole house, so undo is simple). */
  | { type: 'setHouse'; house: HouseDef }
  | { type: 'removeHouse'; id: string }
  | { type: 'moveIn'; botId: string; houseId: string }
  /** Neighbours come round to see the new house. */
  | { type: 'housewarming'; houseId: string }
  /** Decorating a room: add, move or turn, and remove a piece of furniture. */
  | { type: 'addFurniture'; roomId: string; piece: FurnitureInstance }
  | {
      type: 'moveFurniture';
      roomId: string;
      id: string;
      x: number;
      y: number;
      flip?: boolean;
      /** Repaint: a colour, or null to go back to the designed one. */
      paint?: string | null;
    }
  | { type: 'removeFurniture'; roomId: string; id: string }
  /** A tree or the pond on the map, changed by the child. */
  | { type: 'setDecor'; id: string; variant: number }
  /** The characters gallery: a new character, a changed one, a goodbye. */
  | {
      type: 'addBot';
      id: string;
      name: string;
      appearance: Appearance;
      traits: [TraitId, TraitId, TraitId];
      homeId: string;
    }
  | {
      type: 'updateBot';
      botId: string;
      name: string;
      appearance: Appearance;
      traits: [TraitId, TraitId, TraitId];
    }
  | { type: 'removeBot'; botId: string };

/** Apply a child command. Returns false when it does not apply (unknown bot, etc.). */
export function apply(world: World, cmd: Command): boolean {
  switch (cmd.type) {
    case 'give': {
      const bot = getBot(world, cmd.botId);
      const effect = giveEffects[cmd.kind];
      if (!bot || !effect) return false;
      bot.route = [];
      bot.now = {
        activity: effect.activity,
        targetId: `gift:${cmd.kind}`,
        phase: 'doing',
        progress: 0,
        duration: tuning.giveMinutes,
        gains: effect.gains,
        byChild: true,
      };
      bot.happyUntil = world.minute + 10;
      emit(world, { botId: bot.id, type: 'happy', activity: effect.activity });
      if (bot.wish === cmd.kind) {
        bot.wish = null;
        bot.happyUntil = world.minute + 20;
        emit(world, { botId: bot.id, type: 'wishGranted', wish: cmd.kind });
      }
      return true;
    }
    case 'nudge': {
      const bot = getBot(world, cmd.botId);
      if (!bot || bot.mode !== 'auto') return false;
      bot.nudge = cmd.activity;
      const now = bot.now;
      if (now && now.activity !== cmd.activity) {
        if (now.phase === 'doing' && now.activity !== 'chat') {
          // Finish up quickly, then do what was asked.
          now.progress = Math.max(now.progress, tuning.nudgeMinProgress);
        } else {
          bot.now = null;
          bot.route = [];
        }
      }
      return true;
    }
    case 'call': {
      const bot = getBot(world, cmd.botId);
      if (!bot || bot.mode === 'frozen' || bot.travel) return false;
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      const place = { ...cmd.place, ...spot };
      bot.now = {
        activity: 'wait',
        targetId: 'spot',
        phase: 'going',
        progress: 0,
        duration: tuning.callWaitMinutes,
        gains: {},
        byChild: true,
      };
      bot.route = routeTo(bot.place, place);
      return true;
    }
    case 'control': {
      const bot = getBot(world, cmd.botId);
      if (!bot || bot.mode === 'frozen') return false;
      bot.mode = cmd.on ? 'puppet' : 'auto';
      bot.now = null;
      bot.route = [];
      bot.nudge = null;
      return true;
    }
    case 'bring': {
      // Like a dollhouse: they appear right where they were put (no walk across
      // town), stay a little while, then carry on with their day.
      const bot = getBot(world, cmd.botId);
      if (!bot) return false;
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      bot.place = { ...cmd.place, ...spot };
      bot.prev = { ...spot };
      bot.travel = null;
      bot.route = [];
      bot.moving = false;
      if (bot.mode !== 'frozen' && bot.mode !== 'puppet')
        bot.now = {
          activity: 'wait',
          targetId: 'spot',
          phase: 'doing',
          progress: 0,
          duration: tuning.callWaitMinutes,
          gains: {},
          byChild: true,
        };
      return true;
    }
    case 'puppetMove': {
      const bot = getBot(world, cmd.botId);
      if (!bot || bot.mode !== 'puppet' || bot.travel) return false;
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      bot.route = routeTo(bot.place, { ...cmd.place, ...spot });
      return true;
    }
    case 'freeze': {
      const bot = getBot(world, cmd.botId);
      if (!bot) return false;
      if (cmd.on && bot.mode !== 'frozen') {
        bot.modeBeforeFreeze = bot.mode;
        bot.mode = 'frozen';
        bot.moving = false;
        bot.prev = { x: bot.place.x, y: bot.place.y };
      } else if (!cmd.on && bot.mode === 'frozen') {
        bot.mode = bot.modeBeforeFreeze ?? 'auto';
        bot.modeBeforeFreeze = null;
      }
      return true;
    }
    case 'sendHome': {
      const bot = getBot(world, cmd.botId);
      if (!bot || bot.mode === 'frozen') return false;
      bot.mode = 'auto';
      bot.nudge = null;
      startGoHome(world, bot, true);
      return true;
    }
    case 'placeObject': {
      const id = cmd.id ?? `o${world.nextObjectId}`;
      if (world.objects.some((o) => o.id === id)) return false;
      // Keep the counter ahead of any id used, so new objects never collide.
      const n = Number(id.slice(1));
      world.nextObjectId = Math.max(
        world.nextObjectId,
        Number.isFinite(n) ? n + 1 : world.nextObjectId + 1,
      );
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      world.objects.push({
        id,
        kind: cmd.kind,
        place: { ...cmd.place, ...spot },
        placedBy: 'child',
        ...(cmd.raise ? { raise: cmd.raise } : {}),
      });
      return true;
    }
    case 'moveObject': {
      const o = world.objects.find((x) => x.id === cmd.id);
      if (!o) return false;
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      o.place = { ...cmd.place, ...spot };
      if (cmd.raise) o.raise = cmd.raise;
      else delete o.raise;
      // Once the child moves it, it is theirs: bots will not tidy it away.
      o.placedBy = 'child';
      return true;
    }
    case 'removeObject': {
      const before = world.objects.length;
      world.objects = world.objects.filter((x) => x.id !== cmd.id);
      return world.objects.length < before;
    }
    case 'setHouse': {
      const i = world.houses.findIndex((h) => h.id === cmd.house.id);
      const copy = structuredClone(cmd.house);
      const old = world.houses[i];
      // A room rebuilt in the house wizard takes the wizard's furniture again.
      if (old) forgetChangedRooms(world, old, copy);
      if (i >= 0) world.houses[i] = copy;
      else world.houses.push(copy);
      syncHouses(world);
      return true;
    }
    case 'removeHouse': {
      const before = world.houses.length;
      const gone = world.houses.find((h) => h.id === cmd.id);
      world.houses = world.houses.filter((h) => h.id !== cmd.id);
      if (gone && world.roomEdits) {
        world.roomEdits = Object.fromEntries(
          Object.entries(world.roomEdits).filter(([id]) => !id.startsWith(`${gone.id}-`)),
        );
      }
      syncHouses(world);
      return world.houses.length < before;
    }
    case 'moveIn': {
      const bot = getBot(world, cmd.botId);
      if (!bot || findBuilding(cmd.houseId)?.kind !== 'house') return false;
      bot.homeId = cmd.houseId;
      if (bot.mode === 'frozen') return true;
      bot.mode = 'auto';
      startGoHome(world, bot, true);
      return true;
    }
    case 'addFurniture':
    case 'moveFurniture':
    case 'removeFurniture':
      return decorate(world, cmd);
    case 'setDecor': {
      world.decor = { ...world.decor, [cmd.id]: cmd.variant };
      return true;
    }
    case 'housewarming': {
      const house = world.houses.find((h) => h.id === cmd.houseId);
      if (!house) return false;
      house.warmed = true;
      const guests = world.bots
        .filter((b) => b.homeId !== cmd.houseId && b.mode === 'auto')
        .slice(0, 3);
      for (const g of guests) startVisit(world, g, cmd.houseId);
      return guests.length > 0;
    }
    case 'addBot': {
      if (getBot(world, cmd.id)) return false;
      const room = entryRoom(cmd.homeId);
      world.bots.push(
        makeBot(
          {
            id: cmd.id,
            name: cmd.name,
            appearance: cmd.appearance,
            traits: cmd.traits,
            homeId: cmd.homeId,
          },
          { buildingId: room.buildingId, roomId: room.id, x: 450, y: 470 },
        ),
      );
      return true;
    }
    case 'updateBot': {
      const bot = getBot(world, cmd.botId);
      if (!bot) return false;
      bot.name = cmd.name;
      bot.appearance = structuredClone(cmd.appearance);
      bot.traits = [...cmd.traits];
      return true;
    }
    case 'removeBot': {
      const before = world.bots.length;
      world.bots = world.bots.filter((b) => b.id !== cmd.botId);
      return world.bots.length < before;
    }
  }
}

type DecorateCommand = Extract<
  Command,
  { type: 'addFurniture' } | { type: 'moveFurniture' } | { type: 'removeFurniture' }
>;

/**
 * Change a room's furniture. The first change copies the room as designed; from
 * then on the world keeps the whole list (replaced, never mutated, so the room
 * registry sees the change).
 */
function decorate(world: World, cmd: DecorateCommand): boolean {
  const current = world.roomEdits?.[cmd.roomId] ?? findBaseRoom(cmd.roomId)?.furniture;
  if (!current || !findRoom(cmd.roomId)) return false;
  let next: FurnitureInstance[];
  if (cmd.type === 'addFurniture') {
    if (!(cmd.piece.kind in furnitureKinds) || fixedKinds.includes(cmd.piece.kind)) return false;
    if (current.some((f) => f.id === cmd.piece.id)) return false;
    const piece = { ...cmd.piece, ...clampFurniture(cmd.piece) };
    next = [...current, piece];
  } else {
    const piece = current.find((f) => f.id === cmd.id);
    if (!piece || fixedKinds.includes(piece.kind)) return false;
    if (cmd.type === 'removeFurniture') {
      next = current.filter((f) => f !== piece);
    } else {
      const moved: FurnitureInstance = { ...piece, x: cmd.x, y: cmd.y };
      if (cmd.flip !== undefined) moved.flip = cmd.flip;
      if (cmd.paint === null) delete moved.paint;
      else if (cmd.paint !== undefined) moved.paint = cmd.paint;
      next = current.map((f) => (f === piece ? { ...moved, ...clampFurniture(moved) } : f));
    }
  }
  world.roomEdits = { ...world.roomEdits, [cmd.roomId]: next };
  syncHouses(world);
  return true;
}

const itemsIn = (h: HouseDef, space: number) =>
  JSON.stringify(h.items.filter((p) => p.room === space));

/** Drop the decorating of rooms whose type or wizard furniture changed. */
function forgetChangedRooms(world: World, before: HouseDef, after: HouseDef): void {
  if (!world.roomEdits) return;
  const edits = { ...world.roomEdits };
  let changed = false;
  before.rooms.forEach((type, space) => {
    const id = roomIdOf(after, space);
    if (!edits[id]) return;
    if (type !== after.rooms[space] || itemsIn(before, space) !== itemsIn(after, space)) {
      delete edits[id];
      changed = true;
    }
  });
  if (changed) world.roomEdits = edits;
}
