// Undo and redo for everything the child does (never for the bots' own choices).
// Each step remembers how to put things back: the state of the bot it touched, or
// the object it placed, moved or removed.
import type { HouseDef } from '../content/house';
import { apply, type Command } from './commands';
import { syncHouses } from './houses';
import type { Bot, PlacedObject, World } from './types';
import { getBot } from './world';

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
  | { kind: 'town'; houses: HouseDef[]; bots: { id: string; state: BotControlState }[] };

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
    case 'setHouse':
    case 'removeHouse':
    case 'housewarming':
      return {
        kind: 'town',
        houses: clone(world.houses),
        bots: world.bots.map((b) => ({ id: b.id, state: botState(b) })),
      };
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
    case 'town':
      world.houses = clone(inv.houses);
      for (const { id, state } of inv.bots) {
        const bot = getBot(world, id);
        if (bot) Object.assign(bot, clone(state));
      }
      syncHouses(world);
      return;
  }
}

export const HISTORY_LIMIT = 100;

export class History {
  private done: Entry[] = [];
  private undone: Entry[] = [];

  /** Apply a child command and remember how to undo it. */
  do(world: World, cmd: Command): boolean {
    // Give placed objects a fixed id up front, so redo recreates the same one.
    const fixed: Command =
      cmd.type === 'placeObject' && !cmd.id ? { ...cmd, id: `o${world.nextObjectId}` } : cmd;
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
