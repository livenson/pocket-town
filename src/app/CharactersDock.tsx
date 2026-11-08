import { playSfx } from '../audio/audio';
import { activityLook } from '../content/activities';
import { strings } from '../i18n';
import type { Bot } from '../sim/types';
import { useCarrySource } from '../input/carry';
import { PERSON, usePlay } from '../state/play';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { PegPortrait } from '../ui/PegPortrait';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { useWorldTick } from './game';
import { doingIcon, doingLabel } from './botText';

const PORTRAIT_BG = ['#FFD2AE', '#FFE08A', '#CDD6FF', '#FAD0DC', '#D9F0C4', '#BFE6DC'];

function Portrait({ bot, index }: { bot: Bot; index: number }) {
  const label = strings.botHere(bot.name, doingLabel(bot));
  const voice = useVoiceLabel(label);
  const selected = usePlay((s) => s.selectedBotId === bot.id);
  const carrying = usePlay((s) => s.carrying);
  const openCard = usePlay((s) => s.openCard);
  // Drag them to another spot in the room; a tap opens their card.
  const move = useCarrySource(PERSON, { from: 'person', botId: bot.id }, () => {
    playSfx('tap');
    openCard(bot.id);
  });
  const moving = carrying?.source.from === 'person' && carrying.source.botId === bot.id;
  const icon = doingIcon(bot);
  const tint = bot.now ? activityLook[bot.now.activity].color : undefined;
  return (
    <button
      type="button"
      className="portrait"
      style={{ background: PORTRAIT_BG[index % PORTRAIT_BG.length] }}
      aria-label={label}
      aria-pressed={selected}
      data-target={carrying ? `bot:${bot.id}` : undefined}
      {...voice}
      {...(carrying && !moving ? {} : move)}
      onClick={() => {
        if (carrying && !moving) {
          playSfx('tap');
          openCard(bot.id);
        } else move.onClick();
      }}
    >
      <span className="portrait__face">
        <PegPortrait
          appearance={bot.appearance}
          size={90}
          crop="head"
          eyes={bot.now?.activity === 'sleep' ? 'sleep' : 'open'}
        />
      </span>
      {icon && (
        <span className="portrait__doing" style={{ color: tint }} aria-hidden="true">
          <Icon name={icon} size={18} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * Someone elsewhere in town: drag them onto the floor, or tap them (they ride on
 * the halo) and tap the floor. They appear where they are put.
 */
function Elsewhere({ bot, index }: { bot: Bot; index: number }) {
  const label = strings.bringPerson(bot.name);
  const voice = useVoiceLabel(label);
  const source = useCarrySource(PERSON, { from: 'person', botId: bot.id });
  const inHand = usePlay(
    (s) => s.carrying?.source.from === 'person' && s.carrying.source.botId === bot.id,
  );
  return (
    <button
      type="button"
      className="portrait portrait--elsewhere"
      style={{ background: PORTRAIT_BG[index % PORTRAIT_BG.length] }}
      aria-label={label}
      aria-pressed={inHand}
      data-in-hand={inHand || undefined}
      {...voice}
      {...source}
    >
      <span className="portrait__face">
        <PegPortrait appearance={bot.appearance} size={90} crop="head" />
      </span>
      <span className="portrait__bring" aria-hidden="true">
        <Icon name="plus" size={18} strokeWidth={3.4} />
      </span>
    </button>
  );
}

/**
 * Characters dock: everyone in this room (tap to open their card), then everyone
 * else in town, ready to be brought in (drag or tap). The last button opens My
 * characters, to make someone new.
 */
export function CharactersDock() {
  const world = useWorldTick(2);
  const roomId = useUi((s) => s.roomId);
  const go = useUi((s) => s.go);
  const here = world.bots.filter((b) => !b.travel && b.place.roomId === roomId);
  const others = world.bots.filter((b) => b.travel || b.place.roomId !== roomId);
  return (
    <div className="characters-dock__list">
      <div className="characters-dock__people">
        {here.map((b) => (
          <Portrait key={b.id} bot={b} index={world.bots.indexOf(b)} />
        ))}
        {others.length > 0 && (
          <>
            <span
              className="characters-dock__divider"
              role="separator"
              aria-label={strings.othersInTown}
            />
            {others.map((b) => (
              <Elsewhere key={b.id} bot={b} index={world.bots.indexOf(b)} />
            ))}
          </>
        )}
      </div>
      <IconButton
        icon="people"
        label={strings.screens.characters}
        onClick={() => go('characters')}
      />
    </div>
  );
}
