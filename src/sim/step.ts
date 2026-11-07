// One simulation tick (1/10 s of real time at normal speed). Deterministic: all
// randomness comes from world.rng.
import { wishFor, type ActivityId } from '../content/activities';
import { findRoom } from '../content/rooms';
import { NEEDS, tuning } from '../content/tuning';
import type { IconName } from '../design/icons';
import { spotPlace, usersOf, availableForChat } from './ads';
import { isNight } from './clock';
import { decayMultiplier, effectiveGains, plan } from './planner';
import { nextRandom, pick } from './rng';
import type { Bot, Doing, Place, SimEvent, World } from './types';
import { clampToFloor, entryRoom, frontDoorX, getBot, routeTo, DOOR_Y } from './world';

const MAX_EVENTS = 80;
const CHAT_EMOTES: IconName[] = ['talk', 'heart', 'face', 'note'];
/** Objects bots drop after playing with a gift (so a tidy bot has work). */
const DROPPED_AFTER_PLAY = new Set(['ball', 'blocks']);

export function emit(world: World, event: Omit<SimEvent, 'minute' | 'seq'>): void {
  world.events.push({ seq: world.nextEventSeq++, minute: world.minute, ...event });
  if (world.events.length > MAX_EVENTS) world.events.splice(0, world.events.length - MAX_EVENTS);
}

function clampNeeds(bot: Bot): void {
  for (const n of NEEDS) bot.needs[n] = Math.max(0, Math.min(100, bot.needs[n]));
}

/** Needs drift down over time; the current activity restores them gradually. */
function updateNeeds(world: World, bot: Bot, dm: number): void {
  const energyCfg = tuning.energy[world.energy];
  const sleeping =
    bot.now?.phase === 'doing' && (bot.now.activity === 'sleep' || bot.now.activity === 'nap');
  for (const need of NEEDS) {
    if (need === 'energy' && sleeping) continue;
    bot.needs[need] -=
      (tuning.decayPerHour[need] / 60) * dm * decayMultiplier(bot, need) * energyCfg.decay;
  }
  if (bot.now?.phase === 'doing') {
    if (bot.now.activity === 'sleep') {
      bot.needs.energy += (tuning.sleepRecoveryPerHour / 60) * dm;
    } else {
      for (const need of NEEDS) {
        bot.needs[need] += ((bot.now.gains[need] ?? 0) * dm) / Math.max(1, bot.now.duration);
      }
    }
  }
  clampNeeds(bot);
}

/** Walk along the route. Returns true while still on the way. */
function moveAlong(bot: Bot, dm: number): boolean {
  let budget = tuning.walkSpeed * dm;
  while (budget > 0 && bot.route.length > 0) {
    const leg = bot.route[0];
    if (!leg) break;
    if (leg.kind === 'travel') {
      bot.route.shift();
      bot.travel = { from: bot.place.buildingId, to: leg.toBuildingId, t: 0 };
      return true;
    }
    if (leg.kind === 'door') {
      bot.route.shift();
      const room = findRoom(leg.toRoomId);
      bot.place = {
        buildingId: room?.buildingId ?? bot.place.buildingId,
        roomId: leg.toRoomId,
        x: leg.x,
        y: leg.y,
      };
      bot.prev = { x: leg.x, y: leg.y };
      continue;
    }
    const dx = leg.x - bot.place.x;
    const dy = leg.y - bot.place.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= budget) {
      bot.place.x = leg.x;
      bot.place.y = leg.y;
      budget -= dist;
      bot.route.shift();
    } else {
      bot.place.x += (dx / dist) * budget;
      bot.place.y += (dy / dist) * budget;
      budget = 0;
    }
    if (Math.abs(dx) > 0.5) bot.facing = dx > 0 ? 1 : -1;
    bot.moving = true;
  }
  return bot.route.length > 0;
}

function arriveFromTravel(world: World, bot: Bot): void {
  const travel = bot.travel;
  if (!travel) return;
  const room = entryRoom(travel.to);
  const x = frontDoorX(room);
  bot.place = { buildingId: travel.to, roomId: room.id, x, y: DOOR_Y };
  bot.prev = { x, y: DOOR_Y };
  bot.travel = null;
  emit(world, { botId: bot.id, type: 'arrive', buildingId: travel.to });
  if (travel.to !== bot.homeId && room.buildingId !== 'park') {
    emit(world, { botId: bot.id, type: 'doorbell', buildingId: travel.to });
  }
}

function startDoing(world: World, bot: Bot, doing: Doing, destination: Place | null): void {
  bot.now = doing;
  bot.route = destination ? routeTo(bot.place, destination) : [];
  bot.wish = null;
  emit(world, { botId: bot.id, type: 'start', activity: doing.activity });
}

function startWander(world: World, bot: Bot): void {
  const x = bot.place.x + (nextRandom(world.rng) - 0.5) * 360;
  const y = bot.place.y + (nextRandom(world.rng) - 0.5) * 60;
  const spot = clampToFloor(x, y);
  bot.now = {
    activity: 'wander',
    phase: 'going',
    progress: 0,
    duration: tuning.wanderMinutes,
    gains: {},
  };
  bot.route = [{ kind: 'walk', x: spot.x, y: spot.y }];
}

export function startGoHome(world: World, bot: Bot, byChild = false): void {
  const room = entryRoom(bot.homeId);
  const spot = clampToFloor(460 + (nextRandom(world.rng) - 0.5) * 200, 460);
  startDoing(
    world,
    bot,
    { activity: 'goHome', phase: 'going', progress: 0, duration: 1, gains: {}, byChild },
    { buildingId: bot.homeId, roomId: room.id, x: spot.x, y: spot.y },
  );
}

/** Pick what to do next (or follow the child's nudge). */
function choose(world: World, bot: Bot): void {
  const energyCfg = tuning.energy[world.energy];
  const nudged = bot.nudge;
  const result = plan(world, bot, nudged ?? undefined);
  if (nudged) bot.nudge = null;

  if (nudged && !result.best) {
    // Nothing offers what the child asked for: show a wish instead.
    bot.wish = nudgeWish(nudged);
    if (bot.wish) emit(world, { botId: bot.id, type: 'wish', wish: bot.wish });
    startWander(world, bot);
    return;
  }

  const best = result.best;
  if (!best || (!nudged && best.score < tuning.wanderThreshold)) {
    if (result.wish && result.wish !== bot.wish) {
      bot.wish = result.wish;
      emit(world, { botId: bot.id, type: 'wish', wish: result.wish });
    }
    startWander(world, bot);
    bot.next = result.best
      ? { activity: result.best.ad.activity, targetId: result.best.ad.targetId }
      : null;
    return;
  }

  const ad = best.ad;
  const slot = usersOf(world, ad.targetId, bot.id);
  const doing: Doing = {
    activity: ad.activity,
    targetId: ad.targetId,
    phase: 'going',
    progress: 0,
    duration: ad.duration * energyCfg.duration,
    gains: effectiveGains(bot, ad),
    byChild: nudged !== null,
  };
  startDoing(world, bot, doing, spotPlace(ad, slot));
  bot.next = result.second
    ? { activity: result.second.ad.activity, targetId: result.second.ad.targetId }
    : null;
  if (result.wish) bot.wish = result.wish;

  // Chatting needs a partner: the other bot (idle or wandering) turns to chat back.
  if (ad.partnerId) {
    const partner = getBot(world, ad.partnerId);
    if (partner && availableForChat(partner)) {
      partner.now = {
        activity: 'chat',
        targetId: `bot:${bot.id}`,
        phase: 'doing',
        progress: 0,
        duration: doing.duration,
        gains: { ...ad.gains },
      };
      partner.route = [];
      emit(world, { botId: partner.id, type: 'start', activity: 'chat' });
    }
  }
}

function nudgeWish(activity: ActivityId): string | null {
  switch (activity) {
    case 'eat':
      return wishFor.hunger;
    case 'nap':
    case 'sleep':
      return wishFor.energy;
    case 'play':
      return wishFor.fun;
    case 'read':
      return 'storybook';
    case 'chat':
      return wishFor.social;
    default:
      return null;
  }
}

function finish(world: World, bot: Bot): void {
  const done = bot.now;
  if (!done) return;
  bot.lastDone[done.activity] = world.minute;
  if (Object.keys(done.gains).length > 0 && done.activity !== 'wander') {
    emit(world, { botId: bot.id, type: 'satisfied', activity: done.activity });
  }
  bot.now = null;
  bot.emote = null;

  // A gift ball or blocks is left on the floor afterwards.
  const gift = done.targetId?.startsWith('gift:') ? done.targetId.slice(5) : null;
  if (gift && DROPPED_AFTER_PLAY.has(gift)) {
    const spot = clampToFloor(bot.place.x + 50 * bot.facing, bot.place.y + 8);
    world.objects.push({
      id: `o${world.nextObjectId++}`,
      kind: gift,
      place: { ...bot.place, x: spot.x, y: spot.y },
      placedBy: 'bot',
    });
  }
  // Tidying puts away a thing a bot left out (never the child's things).
  if (done.activity === 'tidy' && done.targetId?.startsWith('tidy:')) {
    const id = done.targetId.slice(5);
    world.objects = world.objects.filter((o) => !(o.id === id && o.placedBy === 'bot'));
  }
  // Chatting ends for both together.
  if (done.activity === 'chat' && done.targetId?.startsWith('bot:')) {
    const partner = getBot(world, done.targetId.slice(4));
    if (partner?.now?.activity === 'chat' && partner.now.targetId === `bot:${bot.id}`) {
      partner.lastDone.chat = world.minute;
      partner.now = null;
      partner.emote = null;
    }
  }
  // Visitors always head home afterwards (they never stay longer than 2 game hours).
  if (done.activity === 'visit') startGoHome(world, bot);
}

function updateChat(world: World, bot: Bot): void {
  const doing = bot.now;
  if (doing?.activity !== 'chat' || !doing.targetId?.startsWith('bot:')) return;
  const partner = getBot(world, doing.targetId.slice(4));
  const stillChatting =
    partner?.now?.activity === 'chat' &&
    partner.now.targetId === `bot:${bot.id}` &&
    partner.mode !== 'frozen' &&
    partner.travel === null;
  if (!partner || !stillChatting) {
    bot.now = null;
    bot.emote = null;
    return;
  }
  if (partner.place.roomId === bot.place.roomId) {
    bot.facing = partner.place.x >= bot.place.x ? 1 : -1;
  }
  if (doing.phase !== 'doing' || partner.now?.phase !== 'doing') return;
  // Take turns with emote bubbles every few game minutes.
  const turn = Math.floor(world.minute / tuning.chatEmoteMinutes);
  const mine = (turn % 2 === 0) === bot.id < partner.id;
  if (mine && (bot.emote === null || bot.emote.until <= world.minute)) {
    bot.emote = {
      icon: pick(world.rng, CHAT_EMOTES) ?? 'talk',
      until: (turn + 1) * tuning.chatEmoteMinutes,
    };
  } else if (!mine && bot.emote && bot.emote.until <= world.minute) {
    bot.emote = null;
  }
}

function updateBot(world: World, bot: Bot, dm: number): void {
  bot.prev = { x: bot.place.x, y: bot.place.y };
  bot.moving = false;
  if (bot.mode === 'frozen') return;

  updateNeeds(world, bot, dm);
  if (bot.emote && bot.emote.until <= world.minute && bot.now?.activity !== 'chat')
    bot.emote = null;

  const autonomy = tuning.energy[world.energy].autonomy && bot.mode === 'auto';

  if (bot.travel) {
    bot.travel.t += dm / tuning.travelMinutes;
    if (bot.travel.t < 1) return;
    arriveFromTravel(world, bot);
  }

  if (bot.route.length > 0) {
    if (moveAlong(bot, dm)) return;
  }

  const doing = bot.now;
  if (doing) {
    if (doing.phase === 'going') {
      doing.phase = 'doing';
      if (doing.activity === 'visit') {
        doing.duration = Math.min(doing.duration, tuning.visitMaxMinutes);
      }
    }
    updateChat(world, bot);
    const current = bot.now;
    if (!current) return;
    current.progress = Math.min(1, current.progress + dm / Math.max(0.1, current.duration));
    // Sleepers wake when rested, but never in the middle of the night.
    const night = isNight(world.minute);
    if (current.activity === 'sleep' && night) current.progress = Math.min(current.progress, 0.99);
    const rested = current.activity === 'sleep' && bot.needs.energy >= 98 && !night;
    if (current.progress >= 1 || rested) finish(world, bot);
    return;
  }

  if (autonomy || (bot.nudge !== null && bot.mode === 'auto')) choose(world, bot);
}

/** Advance the world by one tick. */
export function step(world: World): void {
  world.tick += 1;
  world.minute += tuning.gameMinutesPerTick;
  const dm = tuning.gameMinutesPerTick;
  const autonomy = tuning.energy[world.energy].autonomy;
  for (const bot of world.bots) {
    // "Paused" bot energy: bots idle in place (child-started actions still finish).
    if (!autonomy && bot.mode === 'auto' && bot.now && !bot.now.byChild) {
      bot.now = null;
      bot.route = [];
    }
    updateBot(world, bot, dm);
  }
}

/** Run many ticks (tests, catching up after being away). */
export function run(world: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) step(world);
}
