// What the child can do to the world (docs/SIM.md → The child's influence ladder).
// Every command is a plain object so it can be recorded, undone and replayed.
import type { ActivityId } from '../content/activities';
import { giveEffects } from '../content/objects';
import { tuning } from '../content/tuning';
import { emit, startGoHome } from './step';
import type { Place, World } from './types';
import { clampToFloor, getBot, routeTo } from './world';

export type Command =
  | { type: 'give'; botId: string; kind: string }
  | { type: 'nudge'; botId: string; activity: ActivityId }
  | { type: 'call'; botId: string; place: Place }
  | { type: 'control'; botId: string; on: boolean }
  | { type: 'puppetMove'; botId: string; place: Place }
  | { type: 'freeze'; botId: string; on: boolean }
  | { type: 'sendHome'; botId: string }
  | { type: 'placeObject'; kind: string; place: Place; id?: string }
  | { type: 'moveObject'; id: string; place: Place }
  | { type: 'removeObject'; id: string };

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
      });
      return true;
    }
    case 'moveObject': {
      const o = world.objects.find((x) => x.id === cmd.id);
      if (!o) return false;
      const spot = clampToFloor(cmd.place.x, cmd.place.y);
      o.place = { ...cmd.place, ...spot };
      // Once the child moves it, it is theirs: bots will not tidy it away.
      o.placedBy = 'child';
      return true;
    }
    case 'removeObject': {
      const before = world.objects.length;
      world.objects = world.objects.filter((x) => x.id !== cmd.id);
      return world.objects.length < before;
    }
  }
}
