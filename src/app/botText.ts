// Words and icons that describe a bot (for labels, voice-over and the card).
import { activityLook } from '../content/activities';
import { NEEDS, type NeedKey } from '../content/tuning';
import type { IconName } from '../design/icons';
import { color } from '../design/tokens';
import { strings } from '../i18n/strings.en';
import type { Bot } from '../sim/types';

const C = strings.card;

export function doingLabel(bot: Bot): string {
  if (bot.mode === 'frozen') return strings.activities.frozen ?? '';
  if (bot.mode === 'puppet') return strings.activities.puppet ?? '';
  if (bot.travel) return strings.activities.travel ?? '';
  if (!bot.now) return strings.activities.idle ?? '';
  return strings.activities[bot.now.activity] ?? '';
}

/** For the characters dock: what icon shows what a bot is doing. */
export function doingIcon(bot: Bot) {
  if (bot.mode === 'frozen') return 'snow' as const;
  if (bot.mode === 'puppet') return 'hand' as const;
  if (bot.travel) return 'map' as const;
  return bot.now ? activityLook[bot.now.activity].icon : null;
}

type Mood = keyof typeof C.mood;

/** Mood face from the lowest need (SIM.md → Needs). */
export function moodOf(bot: Bot): { mood: Mood; icon: IconName; bg: string } {
  let lowest: NeedKey = 'hunger';
  for (const n of NEEDS) if (bot.needs[n] < bot.needs[lowest]) lowest = n;
  const value = bot.needs[lowest];
  if (value >= 60) return { mood: 'happy', icon: 'face', bg: color.marigold };
  if (value >= 30) return { mood: 'ok', icon: 'face', bg: '#FFE6CF' };
  const low: Record<string, { mood: Mood; icon: IconName }> = {
    energy: { mood: 'sleepy', icon: 'zzz' },
    hunger: { mood: 'hungry', icon: 'fork' },
    fun: { mood: 'bored', icon: 'ball' },
    social: { mood: 'lonely', icon: 'talk' },
  };
  return { ...(low[lowest] ?? { mood: 'ok', icon: 'face' }), bg: '#FAD0DC' };
}
