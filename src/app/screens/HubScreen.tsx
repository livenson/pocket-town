import { playSfx } from '../../audio/audio';
import type { IconName } from '../../design/icons';
import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import type { ScreenId } from '../machine';
import { ScreenFrame } from './ScreenFrame';

interface HubTile {
  icon: IconName;
  label: string;
  tone: 'teal' | 'tomato' | 'marigold' | 'cornflower';
  to?: ScreenId;
  locked?: boolean;
}

const TILES: HubTile[] = [
  { icon: 'globe', label: strings.hub.world, tone: 'teal', to: 'map' },
  { icon: 'peg', label: strings.hub.myCharacters, tone: 'tomato', to: 'characters' },
  { icon: 'house', label: strings.hub.myHouse, tone: 'marigold', to: 'houseWizard' },
  { icon: 'people', label: strings.hub.friendsLocked, tone: 'cornflower', locked: true },
];

function Tile({ tile }: { tile: HubTile }) {
  const go = useUi((s) => s.go);
  const toast = useUi((s) => s.toast);
  const voice = useVoiceLabel(tile.label);
  return (
    <button
      type="button"
      className={`hub-tile hub-tile--${tile.tone}`}
      aria-label={tile.label}
      data-locked={tile.locked || undefined}
      {...voice}
      onClick={() => {
        playSfx(tile.locked ? 'soft' : 'tap');
        if (tile.to) go(tile.to);
        else toast('lock', tile.label);
      }}
    >
      <Icon name={tile.icon} size={72} strokeWidth={3} />
      {tile.locked && (
        <span className="hub-tile__lock" aria-hidden="true">
          <Icon name="lock" size={26} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** B2 home hub. M7 adds the live house diorama. */
export function HubScreen() {
  const go = useUi((s) => s.go);
  return (
    <ScreenFrame
      title={strings.screens.hub}
      nav={false}
      showTitle={false}
      actions={
        <>
          <IconButton icon="sliders" label={strings.settings} onClick={() => go('settings')} />
          <IconButton icon="lock" label={strings.grownUps} onClick={() => go('gate')} />
        </>
      }
    >
      <div className="hub-grid">
        {TILES.map((t) => (
          <Tile key={t.label} tile={t} />
        ))}
      </div>
    </ScreenFrame>
  );
}
