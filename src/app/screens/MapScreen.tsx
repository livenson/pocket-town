import type { CSSProperties } from 'react';
import { playSfx } from '../../audio/audio';
import { allBuildings, type BuildingDef, type BuildingKind } from '../../content/rooms';
import type { IconName } from '../../design/icons';
import { buildingName, strings } from '../../i18n';
import { minuteOfDay } from '../../sim/clock';
import type { Bot, World } from '../../sim/types';
import { usePlay } from '../../state/play';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { game, useWorldTick } from '../game';
import { BuildingArt } from '../BuildingArt';
import { MapCritters } from '../MapCritters';
import { TimePill } from '../TimePill';

const ICON: Record<BuildingKind, IconName> = {
  house: 'house',
  cafe: 'shop',
  park: 'tree',
  library: 'book',
  musicHall: 'note',
};

/** Where a bot's pin sits: by its building, or part-way along the path when travelling. */
function pinAt(bot: Bot): { x: number; y: number } | null {
  if (bot.travel) {
    const from = allBuildings().find((b) => b.id === bot.travel?.from)?.map;
    const to = allBuildings().find((b) => b.id === bot.travel?.to)?.map;
    if (!from || !to) return null;
    const t = Math.min(1, Math.max(0, bot.travel.t));
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  }
  return allBuildings().find((b) => b.id === bot.place.buildingId)?.map ?? null;
}

function Building({ b, world }: { b: BuildingDef; world: World }) {
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const words = useShowTextLabels();
  const name = buildingName(b.id);
  const label = strings.town.goInto(name);
  const voice = useVoiceLabel(label);
  // A guest is someone here whose home is elsewhere (houses only).
  const guest =
    b.kind === 'house'
      ? world.bots.find((x) => !x.travel && x.place.buildingId === b.id && x.homeId !== b.id)
      : undefined;
  return (
    <button
      type="button"
      className={`map-building map-building--${b.kind}`}
      style={{ left: `${b.map.x * 100}%`, top: `${b.map.y * 100}%` }}
      aria-label={guest ? `${label}. ${strings.town.visitor}` : label}
      {...voice}
      onClick={() => {
        playSfx('tap');
        const room = b.rooms[0];
        if (room) setRoom(room.id);
        go('scene');
      }}
    >
      <BuildingArt b={b} />
      <span className="map-building__sign" aria-hidden="true">
        <Icon name={ICON[b.kind]} size={22} />
      </span>
      {guest && (
        <span className="map-building__flag" aria-hidden="true">
          <span className="map-building__flag-face">
            <PegPortrait appearance={guest.appearance} size={34} crop="head" />
          </span>
        </span>
      )}
      {words && <span className="map-building__label">{name}</span>}
    </button>
  );
}

/** Sun or moon by the time of day, and how far round the day is. */
function TimeDial({ minute }: { minute: number }) {
  const m = minuteOfDay(minute);
  const h = m / 60;
  const part =
    h >= 22 || h < 6
      ? strings.town.night
      : h < 10
        ? strings.town.morning
        : h < 18
          ? strings.town.day
          : strings.town.evening;
  const night = h >= 20 || h < 6;
  const angle = (m / 1440) * 360;
  return (
    <div className="time-dial" role="img" aria-label={`${strings.town.timeOfDay}: ${part}`}>
      <span
        className="time-dial__face"
        style={{ transform: `rotate(${angle}deg)` }}
        aria-hidden="true"
      >
        <span className="time-dial__hand" />
      </span>
      <span className="time-dial__icon" aria-hidden="true">
        <Icon name={night ? 'moon' : 'sun'} size={28} />
      </span>
    </div>
  );
}

const TREES: [number, number][] = [
  [0.66, 0.66],
  [0.72, 0.7],
  [0.92, 0.64],
  [0.06, 0.52],
  [0.94, 0.36],
];
const TREE_KINDS = 5;
const POND_KINDS = 4;

/** The trees and the pond: tap one to change it (saved with the town, undoable). */
function Decor({ world }: { world: World }) {
  const change = (id: string, kinds: number) => {
    playSfx('place');
    game.do({ type: 'setDecor', id, variant: ((world.decor?.[id] ?? 0) + 1) % kinds });
  };
  const pond = world.decor?.pond ?? 0;
  return (
    <div className="world-map__decor">
      <DecorButton
        className="world-map__pond"
        variant={pond}
        label={strings.town.change(strings.town.pondKinds[pond] ?? '')}
        onClick={() => change('pond', POND_KINDS)}
      />
      {TREES.map(([x, y], i) => {
        const id = `tree-${i}`;
        const v = world.decor?.[id] ?? 0;
        return (
          <DecorButton
            key={id}
            className="world-map__tree"
            variant={v}
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            label={strings.town.change(strings.town.treeKinds[v] ?? '')}
            onClick={() => change(id, TREE_KINDS)}
          />
        );
      })}
    </div>
  );
}

function DecorButton({
  className,
  variant,
  label,
  style,
  onClick,
}: {
  className: string;
  variant: number;
  label: string;
  style?: CSSProperties;
  onClick: () => void;
}) {
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      className={className}
      data-variant={variant}
      style={style}
      aria-label={label}
      {...voice}
      onClick={onClick}
    />
  );
}

/** D1 world map: the town, who is where, and the time of day. Tap a building to go in. */
export function MapScreen() {
  const world = useWorldTick(4);
  const home = useUi((s) => s.home);
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const follow = usePlay((s) => s.follow);
  const buildings = allBuildings();
  return (
    <div className="world-map">
      <h1 className="visually-hidden">{strings.screens.map}</h1>
      <div className="world-map__land" aria-hidden="true">
        <span className="world-map__road world-map__road--h" />
        <span className="world-map__road world-map__road--v" />
      </div>
      <Decor world={world} />
      <MapCritters />
      <div className="world-map__places">
        {buildings.map((b) => (
          <Building key={b.id} b={b} world={world} />
        ))}
        {world.bots.map((bot, i) => {
          const at = pinAt(bot);
          if (!at) return null;
          const place = buildingName(bot.travel ? bot.travel.to : bot.place.buildingId);
          const label = bot.travel
            ? strings.town.walking(bot.name, place)
            : strings.town.at(bot.name, place);
          // Several pins at one building fan out around it.
          const here = world.bots.filter(
            (x) => !x.travel && x.place.buildingId === bot.place.buildingId,
          );
          const k = bot.travel ? 0 : here.indexOf(bot);
          const dx = bot.travel ? 0 : (k - (here.length - 1) / 2) * 44;
          return (
            <button
              type="button"
              key={bot.id}
              className="map-pin"
              data-travelling={bot.travel ? true : undefined}
              aria-label={label}
              onClick={() => {
                // Go and watch them: the follow camera keeps up, even on the road.
                playSfx('tap');
                if (!bot.travel) setRoom(bot.place.roomId);
                follow(bot.id);
                go('scene');
              }}
              style={{
                left: `calc(${at.x * 100}% + ${dx}px)`,
                top: `calc(${at.y * 100}% - ${bot.travel ? 30 : 104}px)`,
                zIndex: 20 + i,
              }}
            >
              <PegPortrait appearance={bot.appearance} size={50} crop="head" />
            </button>
          );
        })}
      </div>
      <div className="world-map__top">
        <IconButton icon="home" label={strings.home} shortcut="H" onClick={home} />
        <TimeDial minute={world.minute} />
      </div>
      <div className="world-map__bottom">
        <TimePill />
      </div>
    </div>
  );
}
