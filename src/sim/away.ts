// "While you were away" (SIM.md → Time): catch the town up on the time the app was
// closed, and remember a few moments worth a picture.
import type { ActivityId } from '../content/activities';
import { tuning } from '../content/tuning';
import { step } from './step';
import type { World } from './types';

/** Coming back after this long (real time) shows the postcard. */
export const AWAY_MIN_MS = 10 * 60 * 1000;
/** Never catch up more than two game days. */
export const AWAY_MAX_GAME_MINUTES = 2 * 24 * 60;

export interface Moment {
  botId: string;
  activity: ActivityId;
}

/** Real milliseconds away → game minutes to simulate (capped). */
export function awayGameMinutes(awayMs: number): number {
  const realMinutesPerGameMinute = 1 / (tuning.ticksPerSecond * tuning.gameMinutesPerTick * 60);
  return Math.min(AWAY_MAX_GAME_MINUTES, awayMs / 60_000 / realMinutesPerGameMinute);
}

const WORTH_A_PICTURE: ActivityId[] = [
  'visit',
  'music',
  'eat',
  'sleep',
  'play',
  'chat',
  'planes',
  'shop',
  'tinker',
  'checkup',
];

/**
 * Run the town forward. Steps are one game hour each (the simulation's own small
 * ticks inside), and the moments are the first of each kind of thing that happened,
 * spread over different characters where possible.
 */
export function catchUp(world: World, gameMinutes: number): Moment[] {
  const hours = Math.ceil(gameMinutes / 60);
  const ticksPerHour = Math.round(60 / tuning.gameMinutesPerTick);
  const seen: Moment[] = [];
  for (let h = 0; h < hours; h++) {
    const seq = world.nextEventSeq;
    for (let t = 0; t < ticksPerHour; t++) step(world);
    for (const e of world.events) {
      if (e.seq < seq || e.type !== 'start' || !e.activity) continue;
      if (!WORTH_A_PICTURE.includes(e.activity)) continue;
      if (seen.some((m) => m.activity === e.activity)) continue;
      seen.push({ botId: e.botId, activity: e.activity });
    }
  }
  // Prefer different characters, and the more memorable things first.
  const ranked = WORTH_A_PICTURE.flatMap((a) => seen.filter((m) => m.activity === a));
  const out: Moment[] = [];
  for (const m of ranked) {
    if (out.length >= 4) break;
    if (
      out.some((o) => o.botId === m.botId) &&
      ranked.some((r) => !out.includes(r) && !out.some((o) => o.botId === r.botId))
    )
      continue;
    out.push(m);
  }
  for (const m of ranked) if (out.length < 3 && !out.includes(m)) out.push(m);
  return out.slice(0, 4);
}
