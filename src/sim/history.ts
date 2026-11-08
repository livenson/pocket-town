// Undo and redo for everything the child does (never for the bots' own choices).
// Each step remembers how to put things back: the state of the bot it touched, or
// the object it placed, moved or removed.
import type { FurnitureInstance } from '../content/furniture';
import type { HouseDef } from '../content/house';
import { apply, type Command } from './commands';
import { syncHouses } from './houses';
import type { Bot, PlacedObject, World } from './types';
import { getBot } from './world';
import { onBench } from './workbench';

/** The parts of a bot a child command can change (not where it is standing). */
type BotControlState = Pick<
  Bot,
  | 'mode'
  | 'modeBeforeFreeze'
  | 'now'
  | 'next'
  | 'route'
  | 'nudge'
  | 'wish'
  | 'happyUntil'
  | 'needs'
  | 'homeId'
>;

type Inverse =
  | { kind: 'bot'; botId: string; state: BotControlState }
  | { kind: 'removeObject'; id: string }
  | { kind: 'moveObject'; id: string; object: PlacedObject }
  | { kind: 'restoreObject'; object: PlacedObject; index: number }
  /** The houses and every bot's control state, as they were (house commands). */
  | {
      kind: 'town';
      houses: HouseDef[];
      bots: { id: string; state: BotControlState }[];
      roomEdits: World['roomEdits'];
    }
  /** The whole cast, as it was (adding, changing or removing a character). */
  | { kind: 'cast'; bots: Bot[] }
  /** One character exactly as they were, where they stood included (bring). */
  | { kind: 'oneBot'; bot: Bot }
  | { kind: 'decor'; id: string; variant: number | undefined }
  /** A room's furniture as it was (undefined: never decorated). */
  | { kind: 'room'; roomId: string; furniture: FurnitureInstance[] | undefined }
  /** A workbench put: the things it may touch as they were, and the ids it adds. */
  | { kind: 'bench'; added: string[]; touched: { object: PlacedObject; index: number }[] }
  | { kind: 'car'; key: string; at: number | undefined };

interface Entry {
  cmd: Command;
  inverse: Inverse;
}

const clone = <T>(v: T): T => structuredClone(v);

function botState(bot: Bot): BotControlState {
  const { mode, modeBeforeFreeze, now, next, route, nudge, wish, happyUntil, needs, homeId } = bot;
  return clone({
    mode,
    modeBeforeFreeze,
    now,
    next,
    route,
    nudge,
    wish,
    happyUntil,
    needs,
    homeId,
  });
}

function capture(world: World, cmd: Command): Inverse | null {
  switch (cmd.type) {
    case 'placeObject':
      return { kind: 'removeObject', id: cmd.id ?? `o${world.nextObjectId}` };
    case 'moveObject': {
      const o = world.objects.find((x) => x.id === cmd.id);
      return o ? { kind: 'moveObject', id: o.id, object: clone(o) } : null;
    }
    case 'addBot':
    case 'updateBot':
    case 'removeBot':
      return { kind: 'cast', bots: clone(world.bots) };
    case 'setHouse':
    case 'removeHouse':
    case 'housewarming':
      return {
        kind: 'town',
        houses: clone(world.houses),
        bots: world.bots.map((b) => ({ id: b.id, state: botState(b) })),
        roomEdits: world.roomEdits && clone(world.roomEdits),
      };
    case 'addFurniture':
    case 'moveFurniture':
    case 'removeFurniture':
      return {
        kind: 'room',
        roomId: cmd.roomId,
        furniture: world.roomEdits?.[cmd.roomId] && clone(world.roomEdits[cmd.roomId]),
      };
    case 'setDecor':
      return { kind: 'decor', id: cmd.id, variant: world.decor?.[cmd.id] };
    case 'benchPut': {
      const ids = new Set(onBench(world, cmd.roomId, cmd.benchId).map((o) => o.id));
      if (cmd.objectId) ids.add(cmd.objectId);
      const touched = world.objects.flatMap((object, index) =>
        ids.has(object.id) ? [{ object: clone(object), index }] : [],
      );
      const added = [cmd.objectId ? null : cmd.id, cmd.resultId].filter(
        (id): id is string => id !== undefined && id !== null,
      );
      return { kind: 'bench', added, touched };
    }
    case 'fixCar':
      return { kind: 'car', key: cmd.key, at: world.fixedCars?.[cmd.key] };
    case 'bring': {
      const bot = getBot(world, cmd.botId);
      return bot ? { kind: 'oneBot', bot: clone(bot) } : null;
    }
    case 'removeObject': {
      const index = world.objects.findIndex((x) => x.id === cmd.id);
      const o = world.objects[index];
      return o ? { kind: 'restoreObject', object: clone(o), index } : null;
    }
    default: {
      const bot = getBot(world, cmd.botId);
      return bot ? { kind: 'bot', botId: bot.id, state: botState(bot) } : null;
    }
  }
}

function revert(world: World, inv: Inverse): void {
  switch (inv.kind) {
    case 'bot': {
      const bot = getBot(world, inv.botId);
      if (bot) Object.assign(bot, clone(inv.state));
      return;
    }
    case 'removeObject':
      world.objects = world.objects.filter((o) => o.id !== inv.id);
      return;
    case 'moveObject': {
      const o = world.objects.find((x) => x.id === inv.id);
      if (o) Object.assign(o, clone(inv.object));
      return;
    }
    case 'restoreObject':
      world.objects.splice(Math.min(inv.index, world.objects.length), 0, clone(inv.object));
      return;
    case 'cast':
      world.bots = clone(inv.bots);
      return;
    case 'oneBot': {
      const i = world.bots.findIndex((b) => b.id === inv.bot.id);
      if (i >= 0) world.bots[i] = clone(inv.bot);
      return;
    }
    case 'room': {
      const edits = { ...world.roomEdits };
      if (inv.furniture) edits[inv.roomId] = clone(inv.furniture);
      else delete edits[inv.roomId];
      world.roomEdits = edits;
      syncHouses(world);
      return;
    }
    case 'decor': {
      const decor = { ...world.decor };
      if (inv.variant === undefined) delete decor[inv.id];
      else decor[inv.id] = inv.variant;
      world.decor = decor;
      return;
    }
    case 'bench': {
      const added = new Set(inv.added);
      world.objects = world.objects.filter((o) => !added.has(o.id));
      for (const { object, index } of inv.touched) {
        const i = world.objects.findIndex((o) => o.id === object.id);
        if (i >= 0) world.objects[i] = clone(object);
        else world.objects.splice(Math.min(index, world.objects.length), 0, clone(object));
      }
      return;
    }
    case 'car': {
      const cars = { ...world.fixedCars };
      if (inv.at === undefined) delete cars[inv.key];
      else cars[inv.key] = inv.at;
      world.fixedCars = cars;
      return;
    }
    case 'town':
      world.houses = clone(inv.houses);
      world.roomEdits = inv.roomEdits && clone(inv.roomEdits);
      for (const { id, state } of inv.bots) {
        const bot = getBot(world, id);
        if (bot) Object.assign(bot, clone(state));
      }
      syncHouses(world);
      return;
  }
}

/**
 * Give new objects a fixed id up front, so redo recreates the same ones (and undo
 * knows what to take away).
 */
function withIds(world: World, cmd: Command): Command {
  const n = world.nextObjectId;
  if (cmd.type === 'placeObject' && !cmd.id) return { ...cmd, id: `o${n}` };
  if (cmd.type === 'benchPut' && !cmd.resultId) {
    if (cmd.objectId) return { ...cmd, resultId: `o${n}` };
    return { ...cmd, id: cmd.id ?? `o${n}`, resultId: `o${n + 1}` };
  }
  return cmd;
}

export const HISTORY_LIMIT = 100;

export class History {
  private done: Entry[] = [];
  private undone: Entry[] = [];

  /** Apply a child command and remember how to undo it. */
  do(world: World, cmd: Command): boolean {
    const fixed = withIds(world, cmd);
    const inverse = capture(world, fixed);
    if (!inverse || !apply(world, fixed)) return false;
    this.done.push({ cmd: fixed, inverse });
    if (this.done.length > HISTORY_LIMIT) this.done.shift();
    this.undone = [];
    return true;
  }

  undo(world: World): Command | null {
    const entry = this.done.pop();
    if (!entry) return null;
    revert(world, entry.inverse);
    this.undone.push(entry);
    return entry.cmd;
  }

  redo(world: World): Command | null {
    const entry = this.undone.pop();
    if (!entry) return null;
    const inverse = capture(world, entry.cmd) ?? entry.inverse;
    apply(world, entry.cmd);
    this.done.push({ cmd: entry.cmd, inverse });
    return entry.cmd;
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }

  get canRedo(): boolean {
    return this.undone.length > 0;
  }

  clear(): void {
    this.done = [];
    this.undone = [];
  }
}
