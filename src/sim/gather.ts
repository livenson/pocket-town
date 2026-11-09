// A moment: the child put a thing in one of its places (food on the table, an
// instrument by the piano), and the characters in the room come to share it.
// Deterministic: the nearest free characters, by distance then id.
import { offers } from '../content/activities';
import { giveEffects, placedOffers } from '../content/objects';
import { moments, type Moment } from '../content/placeIdeas';
import { NEEDS, type NeedKey } from '../content/tuning';
import { emit } from './step';
import type { Bot, World } from './types';
import { clampToFloor, routeTo } from './world';

/** Characters in this room who can join (awake, free, not being steered). */
function canJoin(bot: Bot, roomId: string): boolean {
  return (
    bot.mode === 'auto' &&
    bot.travel === null &&
    bot.place.roomId === roomId &&
    bot.now?.activity !== 'sleep' &&
    !bot.now?.byChild
  );
}

/** The bots a moment around this object would invite, nearest first. */
export function invited(world: World, objectId: string, moment: Moment): Bot[] {
  const o = world.objects.find((x) => x.id === objectId);
  if (!o) return [];
  return world.bots
    .filter((b) => canJoin(b, o.place.roomId))
    .map((b) => ({ b, d: Math.abs(b.place.x - o.place.x) + Math.abs(b.place.y - o.place.y) }))
    .toSorted((p, q) => p.d - q.d || (p.b.id < q.b.id ? -1 : 1))
    .slice(0, moments[moment].invite)
    .map((p) => p.b);
}

/** Start a moment around a placed object: invited characters walk over and join in. */
export function gather(world: World, objectId: string, moment: Moment): string[] {
  const o = world.objects.find((x) => x.id === objectId);
  if (!o) return [];
  const def = moments[moment];
  const offerKey = placedOffers[o.kind];
  const offer = offerKey ? offers[offerKey]?.[0] : undefined;
  const base = offer?.gains ?? giveEffects[o.kind]?.gains ?? {};
  const gains: Partial<Record<NeedKey, number>> = { ...base };
  for (const k of NEEDS) {
    const extra = def.bonus[k];
    if (extra) gains[k] = (gains[k] ?? 0) + extra;
  }
  const who = invited(world, objectId, moment);
  who.forEach((bot, i) => {
    // Around the thing, side by side.
    const spot = clampToFloor(o.place.x + (i - (who.length - 1) / 2) * 64, o.place.y + 6);
    bot.now = {
      activity: def.activity,
      targetId: `object:${o.id}`,
      phase: 'going',
      progress: 0,
      duration: def.minutes,
      gains,
      byChild: true,
    };
    bot.route = routeTo(bot.place, { ...o.place, ...spot });
    bot.wish = null;
    bot.happyUntil = world.minute + 10;
    emit(world, { botId: bot.id, type: 'happy', activity: def.activity });
  });
  return who.map((b) => b.id);
}
