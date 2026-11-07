import { useEffect } from 'react';
import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import { activityLook } from '../content/activities';
import { strings } from '../i18n';
import type { Moment } from '../sim/away';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { PegPortrait } from '../ui/PegPortrait';
import { useShowTextLabels } from '../ui/labels';
import { useWorldTick } from './game';

const SHOW_MS = 8000;

function caption(m: Moment, name: string): string {
  const P = strings.postcard;
  switch (m.activity) {
    case 'eat':
      return P.ate(name);
    case 'sleep':
      return P.slept(name);
    case 'visit':
      return P.visited(name);
    case 'music':
      return P.music(name);
    case 'chat':
      return P.chatted(name);
    default:
      return P.played(name);
  }
}

/** "While you were away": three or four picture moments, 5–10 s, any tap skips. */
const IN_TOWN = new Set(['scene', 'hub', 'map']);

export function Postcard() {
  // Waits until the player is in their town (not on the splash or picking a face).
  const inTown = useUi((s) => IN_TOWN.has(s.nav.screen));
  const pending = useUi((s) => s.postcard);
  const moments = inTown ? pending : null;
  const close = useUi((s) => s.setPostcard);
  const world = useWorldTick(1);
  const words = useShowTextLabels();

  useEffect(() => {
    if (!moments) return;
    playSfx('jingle');
    speak(strings.postcard.title);
    const t = setTimeout(() => close(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [moments, close]);

  if (!moments || moments.length === 0) return null;
  return (
    <button
      type="button"
      className="postcard"
      aria-label={`${strings.postcard.title}. ${strings.postcard.skip}`}
      onClick={() => {
        playSfx('tap');
        close(null);
      }}
    >
      <span className="postcard__card">
        <span className="postcard__title">{strings.postcard.title}</span>
        <span className="postcard__moments">
          {moments.map((m, i) => {
            const bot = world.bots.find((b) => b.id === m.botId);
            if (!bot) return null;
            const look = activityLook[m.activity];
            const text = caption(m, bot.name);
            return (
              <span
                key={i}
                className="postcard__moment"
                role="img"
                aria-label={text}
                style={{ animationDelay: `${200 + i * 350}ms` }}
              >
                <PegPortrait
                  appearance={bot.appearance}
                  size={110}
                  eyes={m.activity === 'sleep' ? 'sleep' : 'open'}
                />
                {look.icon && (
                  <span className="postcard__icon" style={{ color: look.color }}>
                    <Icon name={look.icon} size={30} />
                  </span>
                )}
                {words && <span className="postcard__caption">{text}</span>}
              </span>
            );
          })}
        </span>
        <span className="postcard__skip" aria-hidden="true">
          <Icon name="play" size={28} />
        </span>
      </span>
    </button>
  );
}
