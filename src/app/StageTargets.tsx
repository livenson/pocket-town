// Real buttons laid over the Pixi canvas: characters, things on the floor, doors and
// the floor itself. They take taps and drops, keyboard focus and screen readers;
// the stage keeps each one over what it stands for.
import type { MouseEvent } from 'react';
import { game, useWorldTick } from './game';
import { placeOn, useCarrySource } from '../input/carry';
import { playSfx } from '../audio/audio';
import { findRoom } from '../content/rooms';
import { strings, thingName } from '../i18n';
import type { Bot, PlacedObject } from '../sim/types';
import { usePlay } from '../state/play';
import { useUi } from '../state/ui';
import { registerTarget } from '../stage/targets';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { doingLabel } from './botText';

function BotTarget({ bot }: { bot: Bot }) {
  const carrying = usePlay((s) => s.carrying);
  const selected = usePlay((s) => s.selectedBotId === bot.id);
  const openCard = usePlay((s) => s.openCard);
  const label = carrying
    ? strings.giveTo(thingName(carrying.kind), bot.name)
    : strings.botHere(bot.name, doingLabel(bot));
  const voice = useVoiceLabel(label);
  return (
    <button
      ref={(el) => registerTarget(`bot:${bot.id}`, el)}
      type="button"
      className="stage-target stage-target--bot"
      data-target={`bot:${bot.id}`}
      data-valid={carrying ? true : undefined}
      data-selected={selected || undefined}
      data-activity={bot.now?.activity ?? 'idle'}
      aria-label={label}
      {...voice}
      onClick={() => {
        if (carrying) {
          placeOn(`bot:${bot.id}`);
          return;
        }
        playSfx('tap');
        openCard(bot.id);
      }}
    />
  );
}

function ObjectTarget({ object }: { object: PlacedObject }) {
  const carrying = usePlay((s) => s.carrying);
  const label = strings.thingHere(thingName(object.kind));
  const carry = useCarrySource(object.kind, { from: 'object', objectId: object.id });
  const voice = useVoiceLabel(label);
  // While carrying something else, things on the floor are not targets.
  const busy =
    carrying !== null &&
    !(carrying.source.from === 'object' && carrying.source.objectId === object.id);
  return (
    <button
      ref={(el) => registerTarget(`object:${object.id}`, el)}
      type="button"
      className="stage-target stage-target--object"
      data-carried={
        (carrying?.source.from === 'object' && carrying.source.objectId === object.id) || undefined
      }
      aria-label={label}
      tabIndex={busy ? -1 : 0}
      {...voice}
      {...carry}
      onClickCapture={voice.onClickCapture}
    />
  );
}

function DoorTarget({ index, to }: { index: number; to: string }) {
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const carrying = usePlay((s) => s.carrying);
  const label = to === 'outside' ? strings.frontDoor : strings.doorTo(strings.rooms[to] ?? to);
  const voice = useVoiceLabel(label);
  return (
    <button
      ref={(el) => registerTarget(`door:${index}`, el)}
      type="button"
      className="stage-target stage-target--door"
      aria-label={label}
      tabIndex={carrying ? -1 : 0}
      {...voice}
      onClick={() => {
        playSfx('tap');
        if (to === 'outside') go('map');
        else setRoom(to);
      }}
    />
  );
}

function FloorTargets({ controlling }: { controlling: Bot | null }) {
  const carrying = usePlay((s) => s.carrying);
  const roomId = useUi((s) => s.roomId);
  if (!carrying && !controlling) return null;
  const onFloor = (e: MouseEvent<HTMLButtonElement>, key: string) => {
    if (carrying) {
      placeOn(key, e.clientX || undefined, e.clientY || undefined);
      return;
    }
    if (controlling) {
      // Take control: the character walks where the child taps.
      const room = findRoom(roomId);
      const box = e.currentTarget.getBoundingClientRect();
      const spot =
        key === 'floor' && e.clientX
          ? { x: ((e.clientX - box.left) / box.width) * 900, y: 470 }
          : { x: [225, 450, 675][Number(key.slice(5))] ?? 450, y: 480 };
      playSfx('tap');
      game.do({
        type: 'puppetMove',
        botId: controlling.id,
        place: { buildingId: room?.buildingId ?? 'home', roomId, ...spot },
      });
    }
  };
  return (
    <>
      <button
        ref={(el) => registerTarget('floor', el)}
        type="button"
        className="stage-target stage-target--floor"
        data-target="floor"
        data-valid
        aria-label={strings.floor}
        tabIndex={-1}
        onClick={(e) => onFloor(e, 'floor')}
      />
      {strings.floorSpot.map((label, i) => (
        <button
          key={label}
          ref={(el) => registerTarget(`spot:${i}`, el)}
          type="button"
          className="stage-target stage-target--spot"
          data-target={`spot:${i}`}
          data-valid
          aria-label={label}
          onClick={(e) => onFloor(e, `spot:${i}`)}
        />
      ))}
    </>
  );
}

export function StageTargets() {
  const world = useWorldTick(3);
  const roomId = useUi((s) => s.roomId);
  const selectedId = usePlay((s) => s.selectedBotId);
  const room = findRoom(roomId);
  const bots = world.bots.filter((b) => !b.travel && b.place.roomId === roomId);
  const objects = world.objects.filter((o) => o.place.roomId === roomId);
  const selected = world.bots.find((b) => b.id === selectedId);
  const controlling =
    selected?.mode === 'puppet' && selected.place.roomId === roomId ? selected : null;
  return (
    <div className="stage-targets">
      {room?.doors.map((d, i) => (
        <DoorTarget key={`${roomId}-${i}`} index={i} to={d.to} />
      ))}
      <FloorTargets controlling={controlling} />
      {objects.map((o) => (
        <ObjectTarget key={o.id} object={o} />
      ))}
      {bots.map((b) => (
        <BotTarget key={b.id} bot={b} />
      ))}
      <span className="visually-hidden" aria-live="polite">
        {bots.map((b) => `${b.name}: ${doingLabel(b)}${b.now ? '' : ''}`).join('. ')}
      </span>
    </div>
  );
}
