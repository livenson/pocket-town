import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { activityLook } from '../../content/activities';
import { houseRooms, ROOF, roomIdOf } from '../../content/house';
import { findBuilding, type BuildingDef } from '../../content/rooms';
import type { IconName } from '../../design/icons';
import { buildingName, strings } from '../../i18n';
import type { World } from '../../sim/types';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { playerBotId, useWorldTick } from '../game';
import type { ScreenId } from '../machine';

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
  const words = useShowTextLabels();
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
      {words && !tile.locked && <span className="hub-tile__word">{tile.label}</span>}
      {tile.locked && (
        <span className="hub-tile__lock" aria-hidden="true">
          <Icon name="lock" size={26} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** The house of the person playing (their character's home), or the starter house. */
function homeOf(world: World): BuildingDef | undefined {
  const { profiles, activeId } = useProfiles.getState();
  const me = profiles.find((p) => p.id === activeId);
  const bot = me ? world.bots.find((b) => b.id === playerBotId(me)) : undefined;
  return findBuilding(bot?.homeId ?? 'home') ?? findBuilding('home');
}

/** A live cut-away of a house: every room, and who is in it doing what. */
export function HouseDiorama({ building, world }: { building: BuildingDef; world: World }) {
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const house = world.houses.find((h) => h.id === building.id);
  return (
    <div className="hub-diorama" data-rooms={building.rooms.length}>
      <span
        className={`diorama__roof diorama__roof--${house?.shell ?? 'cottage'}`}
        style={{ background: building.roofColor }}
        aria-hidden="true"
      />
      <div className="hub-diorama__rooms">
        {building.rooms.map((room) => {
          const here = world.bots.filter((b) => !b.travel && b.place.roomId === room.id);
          const roomName = strings.rooms[room.id] ?? buildingName(building.id);
          const label = strings.town.roomWith(roomName, here.map((b) => b.name).join(', '));
          return (
            <button
              key={room.id}
              type="button"
              className="hub-diorama__room"
              style={{ background: room.wall, ['--floor' as string]: room.floor }}
              aria-label={label}
              onClick={() => {
                playSfx('tap');
                setRoom(room.id);
                go('scene');
              }}
            >
              <span className="hub-diorama__people" aria-hidden="true">
                {here.map((b) => {
                  const look = b.now ? activityLook[b.now.activity] : null;
                  return (
                    <span key={b.id} className="hub-diorama__person">
                      <PegPortrait
                        appearance={b.appearance}
                        size={72}
                        eyes={b.now?.activity === 'sleep' ? 'sleep' : 'open'}
                      />
                      {look?.icon && (
                        <span className="hub-diorama__doing" style={{ color: look.color }}>
                          <Icon name={look.icon} size={18} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Houses the child built: tap to go inside. */
function BuiltHouses({ world }: { world: World }) {
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

/** B2 home hub: the child's house as a live diorama, and four big tiles. */
export function HubScreen() {
  const world = useWorldTick(2);
  const go = useUi((s) => s.go);
  const profiles = useProfiles((s) => s.profiles);
  const activeId = useProfiles((s) => s.activeId);
  const me = profiles.find((p) => p.id === activeId);
  const home = homeOf(world);

  return (
    <div className="hub">
      <span className="hub__cloud hub__cloud--1" aria-hidden="true" />
      <span className="hub__cloud hub__cloud--2" aria-hidden="true" />
      <span className="hub__hill" aria-hidden="true" />
      <header className="hub__bar">
        {me ? (
          <button
            type="button"
            className="hub__me"
            aria-label={strings.town.switchPlayer(me.name)}
            onClick={() => {
              playSfx('tap');
              go('profile');
            }}
          >
            <PegPortrait appearance={me.appearance} size={72} crop="head" />
          </button>
        ) : (
          <span />
        )}
        <h1 className="visually-hidden">{strings.screens.hub}</h1>
        <span className="hub__bar-end">
          <IconButton
            icon="speaker"
            label={strings.town.hearScreen}
            onClick={() => speak(strings.town.hubHelp)}
          />
          <IconButton icon="sliders" label={strings.settings} onClick={() => go('settings')} />
          <IconButton icon="lock" label={strings.grownUps} onClick={() => go('gate')} />
        </span>
      </header>
      <main className="hub__main">
        <div className="hub__house">{home && <HouseDiorama building={home} world={world} />}</div>
        <nav className="hub-grid" aria-label={strings.screens.hub}>
          {tiles().map((t) => (
            <Tile key={t.label} tile={t} />
          ))}
        </nav>
      </main>
      <BuiltHouses world={world} />
    </div>
  );
}
