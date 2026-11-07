import { useState, type ReactNode } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import {
  CATEGORIES,
  CELLS,
  emptyHouse,
  FLOORS,
  houseRooms,
  ITEM_KEYS,
  ITEMS,
  PLOTS,
  readyHouse,
  ROOF,
  ROOM_KEYS,
  ROOM_TYPES,
  roomIdOf,
  SHELLS,
  WALLS,
  type HouseDef,
  type HouseItem,
  type ItemCategory,
  type RoomType,
  type Shell,
} from '../../content/house';
import { town } from '../../content/rooms';
import type { IconName } from '../../design/icons';
import { strings } from '../../i18n';
import { usePlay } from '../../state/play';
import { useUi } from '../../state/ui';
import { HoldButton } from '../../ui/HoldButton';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { StepRail } from '../../ui/StepRail';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { game, useGame, useWorldTick } from '../game';

type Step = 'plot' | 'shell' | 'mode' | 'rooms' | 'paint' | 'furniture' | 'moveIn' | 'warming';
const STEPS: { id: Step; icon: IconName }[] = [
  { id: 'plot', icon: 'map' },
  { id: 'shell', icon: 'home' },
  { id: 'mode', icon: 'sparkle' },
  { id: 'rooms', icon: 'rooms' },
  { id: 'paint', icon: 'roller' },
  { id: 'furniture', icon: 'sofa' },
  { id: 'moveIn', icon: 'people' },
  { id: 'warming', icon: 'star' },
];
/** One of the items at random (falls back if the list is empty). */
function rand<T>(items: readonly T[], fallback: T): T {
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}
const coinFlip = (): boolean => Math.random() < 0.5;
/** Four different grid cells at random. */
function randomCells(): number[] {
  return [...Array(CELLS).keys()].toSorted(() => Math.random() - 0.5).slice(0, 4);
}

function Tile({
  label,
  selected,
  onPick,
  children,
  className,
  style,
  hint,
}: {
  label: string;
  selected?: boolean;
  onPick: () => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hint?: boolean;
}) {
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      className={['choice', className ?? '', hint ? 'hint-glow-self' : '']
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-label={label}
      aria-pressed={selected}
      {...voice}
      onClick={onPick}
    >
      {children}
      {selected && (
        <span className="choice__tick" aria-hidden="true">
          <Icon name="check" size={16} strokeWidth={3.4} />
        </span>
      )}
    </button>
  );
}

function Roof({ shell }: { shell: Shell }) {
  return (
    <span
      className={`diorama__roof diorama__roof--${shell}`}
      style={{ background: ROOF[shell] }}
      aria-hidden="true"
    />
  );
}

/** C2 house wizard: build a house step by step, any order, every change undoable. */
export function HouseWizardScreen() {
  const world = useWorldTick(4);
  useGame((s) => s.version);
  const go = useUi((s) => s.go);
  const back = useUi((s) => s.back);
  const setRoom = useUi((s) => s.setRoom);
  const editingId = useUi((s) => s.editingHouseId);
  const setEditing = useUi((s) => s.setEditingHouse);
  const canUndo = useGame((s) => s.canUndo);
  const canRedo = useGame((s) => s.canRedo);
  const words = useShowTextLabels();
  const H = strings.house;

  const [step, setStep] = useState<Step>(editingId ? 'furniture' : 'plot');
  const [visited, setVisited] = useState<Set<Step>>(
    () => new Set([editingId ? 'furniture' : 'plot']),
  );
  const [pickedType, setPickedType] = useState<RoomType | null>(null);
  const [surface, setSurface] = useState<'walls' | 'floors'>('walls');
  const [paintSpace, setPaintSpace] = useState<number | 'all'>('all');
  const [furnRoom, setFurnRoom] = useState(0);
  const [category, setCategory] = useState<ItemCategory>('seat');
  const [pickedItem, setPickedItem] = useState<HouseItem | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [bad, setBad] = useState<number | null>(null);
  const [botTest, setBotTest] = useState(false);
  const [resident, setResident] = useState<string | null>(null);

  const house = world.houses.find((h) => h.id === editingId) ?? null;
  const takenPlots = new Set(world.houses.filter((h) => h.id !== editingId).map((h) => h.plot));
  const freePlot = PLOTS.findIndex((_, i) => !takenPlots.has(i));

  /** The house being built; made on the first change, on a free plot. */
  const current = (): HouseDef => {
    if (house) return house;
    const number = Math.max(1, ...world.houses.map((h) => h.number)) + 1;
    return emptyHouse(`h${number}`, number, freePlot < 0 ? 0 : freePlot);
  };
  const save = (next: HouseDef) => {
    if (game.do({ type: 'setHouse', house: next })) {
      setEditing(next.id);
      playSfx('place');
    }
  };
  const edit = (fn: (h: HouseDef) => void) => {
    const next = structuredClone(current());
    fn(next);
    save(next);
  };

  const goStep = (id: string) => {
    const s = STEPS.find((x) => x.id === id)?.id ?? 'plot';
    setStep(s);
    setVisited((v) => new Set(v).add(s));
    setPickedItem(null);
    setSelectedIdx(null);
    setResident(null);
    speak(H.steps[s] ?? '');
  };

  const surprise = () => {
    playSfx('dice');
    switch (step) {
      case 'plot': {
        const free = PLOTS.map((_, i) => i).filter((i) => !takenPlots.has(i) && i !== house?.plot);
        if (free.length) edit((h) => (h.plot = rand(free, 0)));
        break;
      }
      case 'shell':
        edit(
          (h) =>
            (h.shell = rand(
              SHELLS.filter((s) => s !== h.shell),
              'cottage',
            )),
        );
        break;
      case 'mode':
        if (coinFlip()) chooseReady();
        else chooseDecorate();
        break;
      case 'rooms':
        edit(
          (h) =>
            (h.rooms = [
              rand(ROOM_KEYS, 'living'),
              rand(ROOM_KEYS, 'living'),
              rand(ROOM_KEYS, 'living'),
              rand(ROOM_KEYS, 'living'),
            ]),
        );
        break;
      case 'paint':
        edit((h) => {
          h.walls = [
            rand(WALLS, '#FFF8F0'),
            rand(WALLS, '#FFF8F0'),
            rand(WALLS, '#FFF8F0'),
            rand(WALLS, '#FFF8F0'),
          ];
          h.floors = [
            rand(FLOORS, '#E0A46B'),
            rand(FLOORS, '#E0A46B'),
            rand(FLOORS, '#E0A46B'),
            rand(FLOORS, '#E0A46B'),
          ];
        });
        break;
      case 'furniture':
        edit((h) => {
          h.items = h.items.filter((p) => p.room !== furnRoom);
          const cells = randomCells();
          for (const cell of cells)
            h.items.push({
              room: furnRoom,
              cell,
              item: rand(ITEM_KEYS, 'lamp'),
              flip: coinFlip(),
            });
        });
        break;
      case 'moveIn': {
        const h = current();
        if (!house) save(h);
        const candidates = world.bots.filter((b) => b.homeId !== h.id);
        for (const b of candidates.slice(0, 2))
          game.do({ type: 'moveIn', botId: b.id, houseId: h.id });
        break;
      }
      case 'warming':
        warm();
        break;
    }
  };

  const chooseReady = () => {
    save(readyHouse(current()));
    setVisited((v) => new Set([...v, 'rooms', 'paint', 'furniture', 'moveIn']));
    goStep('moveIn');
  };
  const chooseDecorate = () => {
    edit((h) => (h.mode = 'decorate'));
    goStep('rooms');
  };

  const warm = () => {
    const h = house;
    if (!h || houseRooms(h).length === 0) return;
    playSfx('jingle');
    game.do({ type: 'housewarming', houseId: h.id });
    speak(H.steps.warming ?? '');
  };

  const enter = () => {
    const h = house;
    const first = h ? houseRooms(h)[0] : undefined;
    if (!h || first === undefined) return;
    usePlay.getState().follow(null);
    setRoom(roomIdOf(h, first));
    go('scene');
  };

  const isDone = (s: Step): boolean => {
    const h = house;
    if (!h) return false;
    switch (s) {
      case 'plot':
        return true;
      case 'shell':
        return visited.has('shell');
      case 'mode':
        return h.mode !== null;
      case 'rooms':
        return h.rooms.every(Boolean);
      case 'paint':
        return visited.has('paint');
      case 'furniture':
        return h.items.length > 0;
      case 'moveIn':
        return world.bots.some((b) => b.homeId === h.id);
      case 'warming':
        return h.warmed;
    }
  };

  const residents = house ? world.bots.filter((b) => b.homeId === house.id) : [];

  // ---------- The big picture in the middle ----------
  const plotMap = (
    <div className="plot-map" role="group" aria-label={H.steps.plot}>
      {town.map((b) => (
        <span
          key={b.id}
          className="plot-map__building"
          style={{ left: `${b.map.x * 100}%`, top: `${b.map.y * 100}%`, background: b.roofColor }}
          aria-hidden="true"
        />
      ))}
      {PLOTS.map((p, i) => {
        const taken = takenPlots.has(i);
        const mine = house?.plot === i;
        return (
          <button
            key={i}
            type="button"
            className="plot-map__plot"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            data-hint={!house || undefined}
            data-mine={mine || undefined}
            aria-label={H.plot(i + 1)}
            aria-pressed={mine}
            aria-disabled={taken || undefined}
            onClick={() => {
              if (taken) {
                playSfx('invalid');
                return;
              }
              edit((h) => (h.plot = i));
              speak(H.goodSpot);
            }}
          >
            {mine ? (
              <Roof shell={house.shell} />
            ) : (
              <Icon name={taken ? 'house' : 'plus'} size={30} />
            )}
          </button>
        );
      })}
    </div>
  );

  const h = house ?? current();
  const diorama = (
    <div className="diorama" data-shell={h.shell}>
      <Roof shell={h.shell} />
      <div className="diorama__rooms">
        {[0, 1, 2, 3].map((i) => {
          const type = h.rooms[i];
          const label = H.space(i + 1, type ? (H.roomTypes[type] ?? type) : H.emptySpace);
          const active =
            (step === 'paint' && (paintSpace === 'all' || paintSpace === i)) ||
            (step === 'furniture' && furnRoom === i);
          return (
            <button
              key={i}
              type="button"
              className="diorama__room"
              style={{ background: h.walls[i], ['--floor' as string]: h.floors[i] }}
              aria-label={label}
              data-active={active || undefined}
              data-target-ok={(step === 'rooms' && pickedType !== null) || undefined}
              onClick={() => {
                if (step === 'rooms') {
                  if (!pickedType) {
                    playSfx('invalid');
                    speak(H.pickRoomFirst);
                    return;
                  }
                  edit((x) => (x.rooms[i] = pickedType));
                } else if (step === 'paint') {
                  playSfx('tap');
                  setPaintSpace(i);
                } else if (step === 'furniture') {
                  playSfx('tap');
                  setFurnRoom(i);
                }
              }}
            >
              <span className="diorama__icon" aria-hidden="true">
                <Icon name={type ? ROOM_TYPES[type].icon : 'plus'} size={34} />
              </span>
              <span className="diorama__items" aria-hidden="true">
                {h.items
                  .filter((p) => p.room === i)
                  .slice(0, 6)
                  .map((p, k) => (
                    <span
                      key={k}
                      style={{ background: ITEMS[p.item].tint, color: ITEMS[p.item].ink }}
                    >
                      <Icon name={ITEMS[p.item].icon} size={16} strokeWidth={3} />
                    </span>
                  ))}
              </span>
              {step === 'moveIn' && (
                <span className="diorama__faces" aria-hidden="true">
                  {residents
                    .filter((_, k) => k % 4 === i)
                    .map((b) => (
                      <PegPortrait key={b.id} appearance={b.appearance} size={44} crop="head" />
                    ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {step === 'moveIn' && (
        <button
          type="button"
          className="diorama__door"
          aria-label={H.frontDoor}
          data-target-ok={resident !== null || undefined}
          onClick={() => {
            if (!resident) {
              playSfx('invalid');
              speak(H.pickSomeone);
              return;
            }
            const next = current();
            if (!house) save(next);
            if (game.do({ type: 'moveIn', botId: resident, houseId: next.id })) {
              playSfx('jingle');
              const who = world.bots.find((b) => b.id === resident);
              if (who) speak(H.movedIn(who.name));
              setResident(null);
            }
          }}
        >
          <Icon name="door" size={34} />
        </button>
      )}
    </div>
  );

  const roomItems = h.items.map((p, i) => ({ ...p, i })).filter((p) => p.room === furnRoom);
  const furnitureView = (
    <div className="furnish">
      <div className="furnish__tabs" role="group" aria-label={H.steps.rooms}>
        {[0, 1, 2, 3].map((i) => {
          const type = h.rooms[i];
          return (
            <IconButton
              key={i}
              icon={type ? ROOM_TYPES[type].icon : 'plus'}
              label={H.roomTab(type ? (H.roomTypes[type] ?? type) : H.emptySpace)}
              tone="plain"
              noTextLabel
              pressed={furnRoom === i}
              onClick={() => {
                setFurnRoom(i);
                setSelectedIdx(null);
              }}
            />
          );
        })}
      </div>
      <div
        className="furnish__room"
        style={{ background: h.walls[furnRoom], ['--floor' as string]: h.floors[furnRoom] }}
      >
        <div className="furnish__grid" role="grid" aria-label={H.steps.furniture}>
          {[...Array(CELLS).keys()].map((c) => {
            const placed = roomItems.find((p) => p.cell === c);
            const sel = placed && selectedIdx === placed.i;
            const target = !placed && (pickedItem !== null || selectedIdx !== null);
            const def = placed ? ITEMS[placed.item] : null;
            const label = placed
              ? `${H.items[placed.item] ?? placed.item}${sel ? `, ${H.selected}` : ''}`
              : H.emptyCell;
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                className="furnish__cell"
                data-row={c < 6 ? 'back' : 'front'}
                data-filled={placed ? true : undefined}
                data-valid={target || undefined}
                data-selected={sel || undefined}
                data-bad={bad === c || undefined}
                style={def ? { background: def.tint, color: def.ink } : undefined}
                aria-label={label}
                onClick={() => {
                  if (pickedItem) {
                    if (placed) {
                      playSfx('invalid');
                      setBad(c);
                      setTimeout(() => setBad((b) => (b === c ? null : b)), 900);
                      return;
                    }
                    const item = pickedItem;
                    edit((x) => x.items.push({ room: furnRoom, cell: c, item, flip: false }));
                    setPickedItem(null);
                    setSelectedIdx(h.items.length);
                    return;
                  }
                  if (placed) {
                    playSfx('tap');
                    setSelectedIdx(sel ? null : placed.i);
                    return;
                  }
                  if (selectedIdx !== null) {
                    const idx = selectedIdx;
                    edit((x) => {
                      const it = x.items[idx];
                      if (it) {
                        it.cell = c;
                        it.room = furnRoom;
                      }
                    });
                  }
                }}
              >
                {placed && def ? (
                  <span
                    style={{ transform: placed.flip ? 'scaleX(-1)' : undefined, display: 'grid' }}
                  >
                    <Icon name={def.icon} size={34} />
                  </span>
                ) : pickedItem ? (
                  <span className="furnish__ghost" aria-hidden="true">
                    <Icon name={ITEMS[pickedItem].icon} size={30} />
                  </span>
                ) : null}
                {bad === c && (
                  <span className="furnish__bad" aria-hidden="true">
                    <Icon name="close" size={18} strokeWidth={3.4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {botTest && (
          <span className="furnish__bot" aria-hidden="true">
            <PegPortrait
              appearance={
                world.bots[0]?.appearance ?? {
                  skin: '#E9B48A',
                  outfit: '#EF4B2F',
                  hair: '#2A1640',
                  hairStyle: 'bob',
                  aid: 'none',
                }
              }
              size={110}
            />
          </span>
        )}
      </div>
    </div>
  );

  // ---------- The options panel ----------
  const panel = (() => {
    switch (step) {
      case 'plot':
        return <p className="wizard-help">{H.steps.plot}</p>;
      case 'shell':
        return (
          <div
            className="wizard-section__grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {SHELLS.map((s) => (
              <Tile
                key={s}
                label={H.shells[s] ?? s}
                selected={h.shell === s}
                className="choice--tall"
                onPick={() => edit((x) => (x.shell = s))}
              >
                <span
                  className={`shell-mini shell-mini--${s}`}
                  style={{ background: ROOF[s] }}
                  aria-hidden="true"
                />
                <span className="shell-mini__body" aria-hidden="true" />
              </Tile>
            ))}
          </div>
        );
      case 'mode':
        return (
          <div className="mode-choices">
            <Tile
              label={H.readyToPlay}
              selected={h.mode === 'play'}
              className="choice--big"
              onPick={chooseReady}
            >
              <Icon name="play" size={48} />
              {words && <span className="choice__word">{H.readyToPlay}</span>}
            </Tile>
            <Tile
              label={H.decorate}
              selected={h.mode === 'decorate'}
              className="choice--big"
              onPick={chooseDecorate}
            >
              <Icon name="roller" size={48} />
              {words && <span className="choice__word">{H.decorate}</span>}
            </Tile>
          </div>
        );
      case 'rooms':
        return (
          <div
            className="wizard-section__grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {ROOM_KEYS.map((t) => (
              <Tile
                key={t}
                label={H.roomTypes[t] ?? t}
                selected={pickedType === t}
                style={{ background: ROOM_TYPES[t].color }}
                onPick={() => {
                  playSfx('pick');
                  setPickedType(pickedType === t ? null : t);
                  speak(H.roomTypes[t] ?? t);
                }}
              >
                <Icon name={ROOM_TYPES[t].icon} size={36} />
                {words && <span className="choice__word">{H.roomTypes[t]}</span>}
              </Tile>
            ))}
          </div>
        );
      case 'paint':
        return (
          <>
            <div className="segmented" role="group" aria-label={H.steps.paint}>
              <IconButton
                icon="rooms"
                label={H.walls}
                tone="plain"
                pressed={surface === 'walls'}
                onClick={() => setSurface('walls')}
              />
              <IconButton
                icon="roller"
                label={H.floors}
                tone="plain"
                pressed={surface === 'floors'}
                onClick={() => setSurface('floors')}
              />
              <IconButton
                icon="home"
                label={H.wholeHouse}
                tone="plain"
                pressed={paintSpace === 'all'}
                onClick={() => setPaintSpace('all')}
              />
            </div>
            <div
              className="wizard-section__grid"
              style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
            >
              {(surface === 'walls' ? WALLS : FLOORS).map((c, k) => (
                <Tile
                  key={c}
                  label={(surface === 'walls' ? H.wallColour : H.floorColour)(k + 1)}
                  className="choice--swatch"
                  style={{ background: c }}
                  selected={
                    paintSpace !== 'all' &&
                    (surface === 'walls' ? h.walls : h.floors)[paintSpace] === c
                  }
                  onPick={() =>
                    edit((x) => {
                      const list = surface === 'walls' ? x.walls : x.floors;
                      for (let i = 0; i < 4; i++)
                        if (paintSpace === 'all' || paintSpace === i) list[i] = c;
                    })
                  }
                />
              ))}
            </div>
          </>
        );
      case 'furniture':
        return (
          <>
            <div className="furnish__cats" role="group" aria-label={H.steps.furniture}>
              {CATEGORIES.map((c) => (
                <IconButton
                  key={c.id}
                  icon={c.icon}
                  label={H.categories[c.id] ?? c.id}
                  tone="plain"
                  noTextLabel
                  pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                />
              ))}
            </div>
            <div
              className="wizard-section__grid"
              style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
            >
              {ITEM_KEYS.filter((k) => ITEMS[k].category === category).map((k) => (
                <Tile
                  key={k}
                  label={H.items[k] ?? k}
                  selected={pickedItem === k}
                  style={{ background: ITEMS[k].tint, color: ITEMS[k].ink }}
                  onPick={() => {
                    playSfx('pick');
                    setSelectedIdx(null);
                    setPickedItem(pickedItem === k ? null : k);
                  }}
                >
                  <Icon name={ITEMS[k].icon} size={40} />
                </Tile>
              ))}
            </div>
            {selectedIdx !== null && h.items[selectedIdx] && (
              <div className="furnish__actions">
                <IconButton
                  icon="rotate"
                  label={H.turn}
                  onClick={() =>
                    edit((x) => {
                      const it = x.items[selectedIdx];
                      if (it) it.flip = !it.flip;
                    })
                  }
                />
                <IconButton
                  icon="dup"
                  label={H.copy}
                  onClick={() => {
                    const it = h.items[selectedIdx];
                    if (!it) return;
                    const free = [...Array(CELLS).keys()].find(
                      (c) => !h.items.some((p) => p.room === it.room && p.cell === c),
                    );
                    if (free === undefined) {
                      playSfx('invalid');
                      return;
                    }
                    edit((x) => x.items.push({ ...it, cell: free }));
                  }}
                />
                <HoldButton
                  label={H.remove}
                  onConfirm={() => {
                    const idx = selectedIdx;
                    setSelectedIdx(null);
                    edit((x) => x.items.splice(idx, 1));
                  }}
                />
              </div>
            )}
            <label className="bot-test">
              <input
                type="checkbox"
                checked={botTest}
                onChange={(e) => setBotTest(e.target.checked)}
              />
              <Icon name="peg" size={26} />
              <span className={words ? '' : 'visually-hidden'}>{H.botTest}</span>
            </label>
          </>
        );
      case 'moveIn':
        return (
          <div
            className="wizard-section__grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {world.bots.map((b) => (
              <Tile
                key={b.id}
                label={residents.includes(b) ? H.movedIn(b.name) : H.resident(b.name)}
                selected={resident === b.id || residents.includes(b)}
                className="choice--tall"
                onPick={() => {
                  playSfx('pick');
                  setResident(resident === b.id ? null : b.id);
                  speak(b.name);
                }}
              >
                <PegPortrait appearance={b.appearance} size={80} crop="head" />
              </Tile>
            ))}
          </div>
        );
      case 'warming':
        return (
          <div className="mode-choices">
            <Tile label={H.warmingGo} selected={h.warmed} className="choice--big" onPick={warm}>
              <Icon name="people" size={48} />
              {words && <span className="choice__word">{H.warmingGo}</span>}
            </Tile>
            <Tile label={H.visitHouse} className="choice--big" onPick={enter}>
              <Icon name="door" size={48} />
              {words && <span className="choice__word">{H.visitHouse}</span>}
            </Tile>
          </div>
        );
    }
  })();

  return (
    <div className="wizard wizard--house">
      <aside className="wizard__rail">
        <StepRail
          label={strings.avatar.stepsLabel}
          current={step}
          onSelect={goStep}
          steps={STEPS.map((s) => ({
            id: s.id,
            icon: s.icon,
            label: H.steps[s.id] ?? s.id,
            done: isDone(s.id) && s.id !== step,
          }))}
        />
      </aside>
      <header className="wizard__top">
        <IconButton icon="back" label={strings.back} onClick={back} />
        <IconButton
          icon="undo"
          label={strings.undo}
          aria-disabled={!canUndo || undefined}
          sound={null}
          onClick={() => game.undo()}
        />
        <IconButton
          icon="redo"
          label={strings.redo}
          aria-disabled={!canRedo || undefined}
          sound={null}
          onClick={() => game.redo()}
        />
        <h1 className="wizard__title">{H.steps[step]}</h1>
        <span className="wizard__top-end">
          <button
            type="button"
            className="dice-button dice-button--small"
            aria-label={strings.avatar.surpriseStep}
            onClick={surprise}
          >
            <Icon name="dice" size={40} strokeWidth={3} />
          </button>
          <button
            type="button"
            className="done-button"
            aria-label={strings.done}
            onClick={() => {
              playSfx('confirm');
              if (step !== 'warming') goStep('warming');
              else enter();
            }}
          >
            <Icon name="check" size={40} strokeWidth={3.2} />
          </button>
        </span>
      </header>
      <main className="wizard__preview wizard__preview--house">
        {step === 'plot' ? plotMap : step === 'furniture' ? furnitureView : diorama}
        {step === 'warming' && h.warmed && (
          <div className="warming" aria-hidden="true">
            {[...Array(8).keys()].map((i) => (
              <span
                key={i}
                className="warming__heart"
                style={{ left: `${10 + i * 11}%`, animationDelay: `${i * 120}ms` }}
              >
                <Icon name="heart" size={28} />
              </span>
            ))}
          </div>
        )}
      </main>
      <section className="wizard__options" aria-label={H.steps[step] ?? ''}>
        {panel}
      </section>
    </div>
  );
}
