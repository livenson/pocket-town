// Utility AI: score every reachable advertisement and pick the best
// (docs/SIM.md → Choosing what to do).
import { wishFor, type ActivityId } from '../content/activities';
import { traits } from '../content/traits';
import { NEEDS, tuning, type NeedKey } from '../content/tuning';
import { isNight } from './clock';
import { nextRandom } from './rng';
import type { Bot, World } from './types';
import { collectAds, usersOf, type Ad } from './ads';

/** Grows sharply as a need runs low: ((100 − v) / 100)². */
export function urgency(value: number): number {
  const v = Math.max(0, Math.min(100, value));
  return ((100 - v) / 100) ** 2;
}

export function traitMultiplier(bot: Bot, activity: ActivityId, otherBuilding: boolean): number {
  let m = 1;
  for (const t of bot.traits) {
    const def = traits[t];
    m *= def.activity?.[activity] ?? 1;
    if (otherBuilding) m *= def.otherBuilding ?? 1;
  }
  return m;
}

export function decayMultiplier(bot: Bot, need: NeedKey): number {
  let m = 1;
  for (const t of bot.traits) m *= traits[t].decay?.[need] ?? 1;
  return m;
}

function noveltyBonus(world: World, bot: Bot, activity: ActivityId): number {
  const last = bot.lastDone[activity];
  const fresh = last === undefined || world.minute - last > tuning.noveltyWindowMinutes;
  if (!fresh) return 1;
  let extra = tuning.noveltyBonus - 1;
  for (const t of bot.traits) extra *= traits[t].novelty ?? 1;
  return 1 + extra;
}

function distancePenalty(bot: Bot, ad: Ad): number {
  if (ad.roomId === bot.place.roomId && bot.travel === null) return tuning.distancePenalty.sameRoom;
  if (ad.buildingId === bot.place.buildingId) return tuning.distancePenalty.sameBuilding;
  return tuning.distancePenalty.otherBuilding;
}

/** Gains for this bot (sleep restores whatever energy is missing). */
export function effectiveGains(bot: Bot, ad: Ad): Partial<Record<NeedKey, number>> {
  if (ad.activity === 'sleep') return { energy: 100 - bot.needs.energy };
  return ad.gains;
}

export function scoreAd(world: World, bot: Bot, ad: Ad, random: number): number {
  const gains = effectiveGains(bot, ad);
  let base = 0;
  for (const need of NEEDS) base += ((gains[need] ?? 0) / 100) * urgency(bot.needs[need]);
  const night = isNight(world.minute);
  if (night && ad.activity === 'sleep') base += tuning.nightSleepBase;
  const other = ad.buildingId !== bot.place.buildingId;
  let score =
    base *
    traitMultiplier(bot, ad.activity, other) *
    distancePenalty(bot, ad) *
    noveltyBonus(world, bot, ad.activity) *
    (tuning.randomnessMin + tuning.randomnessSpan * random);
  if (night) {
    score *=
      ad.activity === 'sleep' || ad.activity === 'nap'
        ? tuning.nightSleepBoost
        : tuning.nightOtherDamp;
  }
  return score;
}

export interface Choice {
  ad: Ad;
  score: number;
}

export interface Plan {
  best: Choice | null;
  second: Choice | null;
  wish: string | null;
}

/** Score everything this bot can reach and has room for. */
export function plan(world: World, bot: Bot, only?: ActivityId): Plan {
  const ads = collectAds(world, bot).filter(
    (ad) =>
      (only === undefined || ad.activity === only) &&
      (ad.activity !== 'tidy' || only === 'tidy' || bot.traits.includes('tidy')) &&
      usersOf(world, ad.targetId, bot.id) < ad.capacity,
  );
  const scored = ads
    .map((ad) => ({ ad, score: scoreAd(world, bot, ad, nextRandom(world.rng)) }))
    .toSorted((a, b) => b.score - a.score);

  // Wish: a need is low and nothing in reach would help.
  let wish: string | null = null;
  for (const need of NEEDS) {
    if (bot.needs[need] >= tuning.wishBelow) continue;
    const helps = ads.some((ad) => (effectiveGains(bot, ad)[need] ?? 0) > 0);
    if (!helps) {
      wish = wishFor[need];
      break;
    }
  }
  const best = scored[0] ?? null;
  // The second-best should be a different activity, so "next" is informative.
  const second = scored.find((c) => best && c.ad.activity !== best.ad.activity) ?? null;
  return { best, second, wish };
}
