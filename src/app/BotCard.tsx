import { useState } from 'react';
import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import { activityLook, nudgeIdeas, type ActivityId } from '../content/activities';
import { findRoom } from '../content/rooms';
import { traits } from '../content/traits';
import type { IconName } from '../design/icons';
import { strings, traitName } from '../i18n';
import type { Bot } from '../sim/types';
import { usePlay } from '../state/play';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { PegPortrait } from '../ui/PegPortrait';
import { Sheet } from '../ui/Sheet';
import { useShowTextLabels } from '../ui/labels';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { game, useWorldTick } from './game';
import { useLayoutMode } from './media';
import { doingLabel, moodOf } from './botText';

const C = strings.card;
const TRAIT_BG: Record<string, string> = {
  snacky: '#FFD2AE',
  sleepy: '#CDD6FF',
  chatty: '#FF8FB1',
  musical: '#E6CCF0',
  explorer: '#BFE6DC',
  tidy: '#FFE08A',
  brave: '#FFB627',
  gardener: '#D9F0C4',
  sporty: '#FAD0DC',
  shy: '#E8D3C1',
};
const NUDGE_ICON: Record<string, IconName> = {
  eat: 'fork',
  nap: 'zzz',
  play: 'ball',
  read: 'book',
  chat: 'talk',
  tidy: 'sparkle',
};

function ActionTile({
  icon,
  label,
  pressed,
  onClick,
}: {
  icon: IconName;
  label: string;
  pressed?: boolean;
  onClick: () => void;
}) {
  const voice = useVoiceLabel(label);
  const words = useShowTextLabels();
  return (
    <button
      type="button"
      className="card-action"
      aria-label={label}
      aria-pressed={pressed}
      {...voice}
      onClick={() => {
        playSfx('tap');
        onClick();
      }}
    >
      <Icon name={icon} size={38} />
      {words && <span aria-hidden="true">{label}</span>}
    </button>
  );
}

function NowNext({ bot }: { bot: Bot }) {
  const now = bot.now;
  const nowLook = now ? activityLook[now.activity] : null;
  const next = bot.next ? activityLook[bot.next.activity] : null;
  const R = 33;
  const circ = 2 * Math.PI * R;
  const progress = now?.phase === 'doing' ? now.progress : 0;
  const words = useShowTextLabels();
  const nextLabel = bot.next ? (strings.activities[bot.next.activity] ?? '') : C.nothing;
  return (
    <div className="card-now">
      <div className="card-now__slot" role="img" aria-label={`${C.now}: ${doingLabel(bot)}`}>
        <span className="card-now__ring">
          <svg viewBox="0 0 76 76" aria-hidden="true">
            <circle cx="38" cy="38" r={R} fill="#fff" stroke="#F3D9C4" strokeWidth="7" />
            {nowLook && (
              <circle
                cx="38"
                cy="38"
                r={R}
                fill="none"
                stroke={nowLook.color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
                transform="rotate(-90 38 38)"
              />
            )}
          </svg>
          <span style={{ color: nowLook?.color }}>
            {nowLook?.icon ? (
              <Icon name={nowLook.icon} size={36} />
            ) : (
              <Icon name="face" size={36} />
            )}
          </span>
        </span>
        {words && <span className="card-cap">{C.now}</span>}
      </div>
      <span className="card-now__arrow" aria-hidden="true">
        <Icon name="next" size={34} />
      </span>
      <div className="card-now__slot" role="img" aria-label={`${C.next}: ${nextLabel}`}>
        <span className="card-now__next" style={{ color: next?.color }}>
          {next?.icon ? <Icon name={next.icon} size={34} /> : <Icon name="hourglass" size={30} />}
        </span>
        {words && <span className="card-cap">{C.next}</span>}
      </div>
      {words && (
        <p className="card-now__text">
          {doingLabel(bot)}
          {bot.next ? `, ${C.thenWord} ${nextLabel}` : ''}
        </p>
      )}
    </div>
  );
}

function CardBody({ bot }: { bot: Bot }) {
  const [nudging, setNudging] = useState(false);
  const closeCard = usePlay((s) => s.closeCard);
  const follow = usePlay((s) => s.follow);
  const roomId = useUi((s) => s.roomId);
  const mood = moodOf(bot);
  const words = useShowTextLabels();
  const controlling = bot.mode === 'puppet';
  const frozen = bot.mode === 'frozen';

  const nudge = (activity: ActivityId) => {
    game.do({ type: 'nudge', botId: bot.id, activity });
    setNudging(false);
    closeCard();
  };

  return (
    <div className="card-body">
      <div className="card-head">
        <span className="card-head__portrait" aria-hidden="true">
          <PegPortrait
            appearance={bot.appearance}
            size={112}
            eyes={bot.now?.activity === 'sleep' ? 'sleep' : 'open'}
          />
        </span>
        <div className="card-head__info">
          <div className="card-head__row">
            <h2 className="card-name">{bot.name}</h2>
            <IconButton
              icon="speaker"
              label={C.hear(bot.name)}
              tone="plain"
              className="card-hear"
              noTextLabel
              onClick={() => speak(`${bot.name}. ${doingLabel(bot)}. ${C.mood[mood.mood]}.`)}
            />
            <span
              className="card-mood"
              style={{ background: mood.bg }}
              role="img"
              aria-label={C.mood[mood.mood]}
            >
              <Icon name={mood.icon} size={30} />
            </span>
          </div>
          <div className="card-traits" role="list" aria-label={C.traits}>
            {bot.traits.map((t) => (
              <span
                key={t}
                role="listitem"
                className="card-trait"
                style={{ background: TRAIT_BG[t] }}
                aria-label={traitName(t)}
              >
                <Icon name={traits[t].icon} size={28} />
                {words && <span className="visually-hidden">{traitName(t)}</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      <NowNext bot={bot} />

      <div className="card-actions">
        <ActionTile icon="eye" label={C.follow} onClick={() => follow(bot.id)} />
        <ActionTile
          icon="target"
          label={C.callHere}
          onClick={() => {
            const room = findRoom(roomId);
            game.do({
              type: 'call',
              botId: bot.id,
              place: { buildingId: room?.buildingId ?? 'home', roomId, x: 450, y: 470 },
            });
            closeCard();
          }}
        />
        <ActionTile
          icon="sparkle"
          label={C.nudge}
          pressed={nudging}
          onClick={() => setNudging((n) => !n)}
        />
        <ActionTile
          icon="hand"
          label={controlling ? C.letGo : C.takeControl}
          pressed={controlling}
          onClick={() => {
            game.do({ type: 'control', botId: bot.id, on: !controlling });
            if (!controlling) closeCard();
          }}
        />
        <ActionTile
          icon="snow"
          label={frozen ? C.unfreeze : C.freeze}
          pressed={frozen}
          onClick={() => game.do({ type: 'freeze', botId: bot.id, on: !frozen })}
        />
        <ActionTile
          icon="home"
          label={C.sendHome}
          onClick={() => {
            game.do({ type: 'sendHome', botId: bot.id });
            closeCard();
          }}
        />
      </div>

      {nudging && (
        <div className="card-nudges" role="group" aria-label={C.nudgeIdeas}>
          {nudgeIdeas.map((a) => (
            <IconButton
              key={a}
              icon={NUDGE_ICON[a] ?? 'sparkle'}
              label={strings.nudges[a] ?? a}
              tone="paper"
              onClick={() => nudge(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** D3 bot detail card: a side panel on tablet and desktop, a bottom sheet on phone. */
export function BotCard() {
  const world = useWorldTick(4);
  const open = usePlay((s) => s.cardOpen);
  const id = usePlay((s) => s.selectedBotId);
  const closeCard = usePlay((s) => s.closeCard);
  const layout = useLayoutMode();
  const bot = world.bots.find((b) => b.id === id);
  if (!open || !bot) return null;

  const close = () => {
    // Closing the card lets go of a character the child was moving.
    if (bot.mode === 'puppet') game.do({ type: 'control', botId: bot.id, on: false });
    closeCard();
    // Nothing stays picked: the floor stops glowing.
    usePlay.getState().select(null);
  };

  if (layout === 'phone') {
    return (
      <Sheet open label={bot.name} onClose={close}>
        <CardBody bot={bot} />
      </Sheet>
    );
  }
  return (
    <section className="bot-card" role="dialog" aria-label={bot.name}>
      <IconButton
        icon="close"
        label={strings.close}
        shortcut="Esc"
        className="bot-card__close"
        onClick={close}
      />
      <CardBody bot={bot} />
    </section>
  );
}
