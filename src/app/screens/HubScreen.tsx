import { playSfx } from '../../audio/audio';
import type { IconName } from '../../design/icons';
import { strings } from '../../i18n';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import type { ScreenId } from '../machine';
import { houseRooms, ROOF, roomIdOf } from '../../content/house';
import { useWorldTick } from '../game';
import { ScreenFrame } from './ScreenFrame';

interface HubTile {
  icon: IconName;
  label: string;
  tone: 'teal' | 'tomato' | 'marigold' | 'cornflower';
  to?: ScreenId;
  locked?: boolean;
}

const tiles = (): HubTile[] => [
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
        // "My house" always starts a new house; existing ones are below.
        if (tile.to === 'houseWizard') useUi.getState().setEditingHouse(null);
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

/** Houses the child built: tap to go inside. */
function BuiltHouses() {
  const world = useWorldTick(1);
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const houses = world.houses.filter((h) => houseRooms(h).length > 0);
  if (houses.length === 0) return null;
  return (
    <section className="built-houses" aria-label={strings.house.builtHouses}>
      {houses.map((h) => (
        <button
          key={h.id}
          type="button"
          className="built-house"
          aria-label={strings.house.name(h.number)}
          onClick={() => {
            playSfx('tap');
            const first = houseRooms(h)[0] ?? 0;
            setRoom(roomIdOf(h, first));
            go('scene');
          }}
        >
          <span
            className={`shell-mini shell-mini--${h.shell}`}
            style={{ background: ROOF[h.shell] }}
            aria-hidden="true"
          />
          <span className="shell-mini__body" aria-hidden="true">
            {h.number}
          </span>
        </button>
      ))}
    </section>
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
        {tiles().map((t) => (
          <Tile key={t.label} tile={t} />
        ))}
      </div>
      <BuiltHouses />
    </ScreenFrame>
  );
}
