import { playSfx } from '../audio/audio';
import { activityLook } from '../content/activities';
import { strings } from '../i18n';
import type { Bot } from '../sim/types';
import { usePlay } from '../state/play';
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
      onClick={() => {
        playSfx('tap');
        openCard(bot.id);
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

/** Characters dock: portraits of everyone in this room. Tap one to open its card. */
export function CharactersDock() {
  const world = useWorldTick(2);
  const roomId = useUi((s) => s.roomId);
  const go = useUi((s) => s.go);
  const here = world.bots.filter((b) => !b.travel && b.place.roomId === roomId);
  return (
    <div className="characters-dock__list">
      {here.map((b) => (
        <Portrait key={b.id} bot={b} index={world.bots.indexOf(b)} />
      ))}
      <IconButton icon="plus" label={strings.more} onClick={() => go('characters')} />
    </div>
  );
}
