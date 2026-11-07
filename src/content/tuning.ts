// Simulation numbers (docs/SIM.md). Tune here, not in the logic.

export type NeedKey = 'hunger' | 'energy' | 'fun' | 'social';
export const NEEDS: readonly NeedKey[] = ['hunger', 'energy', 'fun', 'social'];

export const tuning = {
  ticksPerSecond: 10,
  /** 1 game minute = 0.5 s at normal speed → 0.2 game minutes per tick. */
  gameMinutesPerTick: 0.2,
  minutesPerDay: 1440,
  fastForward: 4,

  /** Need decay per game hour (0 = urgent, 100 = satisfied). */
  decayPerHour: { hunger: 6, energy: 4, fun: 5, social: 3 } satisfies Record<NeedKey, number>,
  /** Energy recovered per game hour while sleeping. */
  sleepRecoveryPerHour: 12,

  /** Planner. */
  wanderThreshold: 0.05,
  noveltyBonus: 1.15,
  noveltyWindowMinutes: 120,
  distancePenalty: { sameRoom: 1, sameBuilding: 0.8, otherBuilding: 0.5 },
  randomnessMin: 0.9,
  randomnessSpan: 0.2,
  /** Below this a need with nothing to satisfy it becomes a wish. */
  wishBelow: 20,

  /** Night: 22:00–07:00. Sleep is preferred, everything else damped. */
  nightStartMinute: 22 * 60,
  /** Sleep that starts in the day is a nap: it ends after this, so an evening nap
   *  does not turn into a 12-hour night (nobody wakes before morning). */
  napMaxMinutes: 150,
  nightEndMinute: 7 * 60,
  nightSleepBoost: 4,
  /** At night, bedtime pulls even when a bot is not tired. */
  nightSleepBase: 0.1,
  nightOtherDamp: 0.4,

  /** Movement in room units per game minute (≈ 90 units per real second). */
  walkSpeed: 45,
  /** Game minutes to cross the town map between two buildings. */
  travelMinutes: 18,

  /** Child influence. */
  nudgeMinProgress: 0.8,
  callWaitMinutes: 30,
  giveMinutes: 8,
  visitMaxMinutes: 120,
  wanderMinutes: 6,

  /** Bot energy setting: multipliers on decay and on activity length. */
  energy: {
    lively: { decay: 1, duration: 1, autonomy: true },
    calm: { decay: 0.5, duration: 1.5, autonomy: true },
    paused: { decay: 0, duration: 1, autonomy: false },
  },

  /** Chat: emote bubbles swap every this many game minutes (≈ 2.5 s). */
  chatEmoteMinutes: 5,
} as const;
