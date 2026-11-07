// Game time helpers. Day 0 starts at 08:00.
import { tuning } from '../content/tuning';

export const START_MINUTE = 8 * 60;

/** Minute of the day, 0–1439. */
export function minuteOfDay(minute: number): number {
  const m = (START_MINUTE + minute) % tuning.minutesPerDay;
  return m < 0 ? m + tuning.minutesPerDay : m;
}

export function isNight(minute: number): boolean {
  const m = minuteOfDay(minute);
  return m >= tuning.nightStartMinute || m < tuning.nightEndMinute;
}

/** Day number since the start (0, 1, 2...). */
export function dayNumber(minute: number): number {
  return Math.floor((START_MINUTE + minute) / tuning.minutesPerDay);
}
