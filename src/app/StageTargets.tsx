// Real buttons laid over the Pixi canvas: characters, things on the floor, doors and
// the floor itself. They take taps and drops, keyboard focus and screen readers;
// the stage keeps each one over what it stands for.
import type { MouseEvent } from 'react';
import { game, useWorldTick } from './game';
import { placeOn, useCarrySource } from '../input/carry';
import { playSfx } from '../audio/audio';
import { offers } from '../content/activities';
import { suitsThing } from '../content/objects';
import { surfaceOf } from '../content/furniture';
import { findRoom } from '../content/rooms';
import { strings, thingName } from '../i18n';
import type { Bot, PlacedObject } from '../sim/types';
import { useDecor } from '../state/decor';
import { PERSON, usePlay } from '../state/play';
import { DecorTargets } from './decorate/DecorTargets';
import { useUi } from '../state/ui';
import { registerTarget } from '../stage/targets';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { doingLabel } from './botText';
import { BenchHints, BoardTargets } from './workshop/WorkshopTargets';

function BotTarget({ bot }: { bot: Bot }) {
  const carrying = usePlay((s) => s.carrying);
  const selected = usePlay((s) => s.selectedBotId === bot.id);
  const openCard = usePlay((s) => s.openCard);
  // Carrying a person: characters are not somewhere to put them.
  const carryingThing = carrying !== null && carrying.source.from !== 'person';
  const label = carryingThing
    ? strings.giveTo(thingName(carrying.kind), bot.name)
    : strings.botHere(bot.name, doingLabel(bot));
  const voice = useVoiceLabel(label);
  // Drag a character to move them around the room; a tap opens their card.
  const move = useCarrySource(PERSON, { from: 'person', botId: bot.id }, () => {
    if (usePlay.getState().carrying) return;
    playSfx('tap');
    // Picking someone else lets go of the character the child was steering.
    const before = game.world.bots.find((b) => b.id === usePlay.getState().selectedBotId);
    if (before && before.id !== bot.id && before.mode === 'puppet') {
      game.do({ type: 'control', botId: before.id, on: false });
    }
    openCard(bot.id);
  });
  const moving = carrying?.source.from === 'person' && carrying.source.botId === bot.id;
  return (
    <button
      ref={(el) => registerTarget(`bot:${bot.id}`, el)}
      type="button"
      className="stage-target stage-target--bot"
      data-target={`bot:${bot.id}`}
      data-valid={carryingThing || undefined}
      data-selected={selected || undefined}
      data-carried={moving || undefined}
      data-activity={bot.now?.activity ?? 'idle'}
      aria-label={label}
      {...voice}
      {...(carrying && !moving ? {} : move)}
      onClick={() => {
        if (carryingThing) {
          placeOn(`bot:${bot.id}`);
          return;
        }
        if (carrying && !moving) return;
        move.onClick();
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

let shownPencilHint = false;

function furnitureLabel(kind: string): string {
  if (kind === 'carLift') return strings.workshop.fixCar;
  return strings.useFurniture(strings.furnitureNames[kind] ?? kind);
}

/**
 * Furniture that offers something to do: tap it and someone goes to use it. The
 * picked character if there is one (this is also how to steer them to it),
 * otherwise whoever is nearest.
 */
function FurnitureTarget({
  id,
  kind,
  x,
  roomId,
}: {
  id: string;
  kind: string;
  x: number;
  roomId: string;
}) {
  const carrying = usePlay((s) => s.carrying);
  // The car in the garage opens the car-fixing game instead (owner's request).
  const fixing = kind === 'carLift';
  const label = furnitureLabel(kind);
  const voice = useVoiceLabel(label);
  const activity = offers[kind]?.[0]?.activity;
  return (
    <button
      ref={(el) => registerTarget(`furniture:${id}`, el)}
      type="button"
      className="stage-target stage-target--furniture"
      aria-label={label}
      tabIndex={carrying ? -1 : 0}
      {...voice}
      onClick={() => {
        if (fixing) {
          playSfx('tap');
          usePlay.getState().setCarFix(`${roomId}:${id}`);
          return;
        }
        if (!activity) return;
        const world = game.world;
        const here = world.bots.filter(
          (b) => !b.travel && b.place.roomId === roomId && b.mode !== 'frozen',
        );
        const picked = here.find((b) => b.id === usePlay.getState().selectedBotId);
        const who =
          picked ?? here.toSorted((a, b) => Math.abs(a.place.x - x) - Math.abs(b.place.x - x))[0];
        // Show the way to change how it looks: when nobody can come, and once a visit.
        if (!who || !shownPencilHint) {
          shownPencilHint = true;
          useUi.getState().toast('pencil', strings.decorate.howTo);
        }
        if (!who) {
          playSfx('soft');
          return;
        }
        playSfx('tap');
        if (who.mode === 'puppet') game.do({ type: 'control', botId: who.id, on: false });
        game.do({ type: 'nudge', botId: who.id, activity });
        usePlay.getState().closeCard();
      }}
    />
  );
}

/** While carrying a thing: tables, counters and shelves to put it on (they glow). */
function SurfaceTargets({ roomId }: { roomId: string }) {
  const carrying = usePlay((s) => s.carrying);
  const room = findRoom(roomId);
  // Things go on tables and shelves; people do not.
  if (!carrying || carrying.source.from === 'person' || !room) return null;
  return (
    <>
      {room.furniture
        .filter((f) => surfaceOf(f))
        .map((f) => (
          <button
            key={`${roomId}-${f.id}`}
            ref={(el) => registerTarget(`surface:${f.id}`, el)}
            type="button"
            className="stage-target stage-target--surface"
            data-target={`surface:${f.id}`}
            data-valid
            // Only the places that suit the thing glow; any table still takes it.
            data-suggested={suitsThing(carrying.kind, f.kind) || undefined}
            aria-label={strings.putOn(strings.furnitureNames[f.kind] ?? f.kind)}
            onClick={(e) =>
              placeOn(`surface:${f.id}`, e.clientX || undefined, e.clientY || undefined)
            }
          />
        ))}
    </>
  );
}

/**
 * While carrying a thing: the floor in front of pieces it suits glows (a book by
 * the bookshelf, a ball by the toy box). Anywhere else on the floor works too.
 */
function NearTargets({ roomId }: { roomId: string }) {
  const carrying = usePlay((s) => s.carrying);
  const room = findRoom(roomId);
  if (!carrying || carrying.source.from === 'person' || !room) return null;
  return (
    <>
      {room.furniture
        .filter((f) => !surfaceOf(f) && suitsThing(carrying.kind, f.kind))
        .map((f) => (
          <button
            key={`${roomId}-${f.id}`}
            ref={(el) => registerTarget(`near:${f.id}`, el)}
            type="button"
            className="stage-target stage-target--near"
            data-target={`near:${f.id}`}
            data-valid
            data-suggested
            aria-label={strings.putBy(strings.furnitureNames[f.kind] ?? f.kind)}
            onClick={() => placeOn(`near:${f.id}`)}
          />
        ))}
    </>
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

/**
 * The floor, while carrying a thing (put it here) or while a character is picked
 * (walk here): tap a character, then tap the floor, like picking up and placing.
 */
function FloorTargets({ controlling }: { controlling: Bot | null }) {
  const carrying = usePlay((s) => s.carrying);
  const roomId = useUi((s) => s.roomId);
  if (!carrying && !controlling) return null;
  const walkTo = (where: string) =>
    !carrying && controlling ? strings.walkTo(controlling.name, where) : where;
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
      playSfx('place');
      if (controlling.mode !== 'puppet') {
        game.do({ type: 'control', botId: controlling.id, on: true });
      }
      game.do({
        type: 'puppetMove',
        botId: controlling.id,
        place: { buildingId: room?.buildingId ?? 'home', roomId, ...spot },
      });
      // Out of the way, so the child sees them walk; still picked, to move again.
      usePlay.getState().closeCard();
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
        aria-label={walkTo(strings.floor)}
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
          aria-label={walkTo(label)}
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
  const cardOpen = usePlay((s) => s.cardOpen);
  const decorating = useDecor((s) => s.on);
  const room = findRoom(roomId);
  const bots = world.bots.filter((b) => !b.travel && b.place.roomId === roomId);
  const objects = world.objects.filter((o) => o.place.roomId === roomId);
  const selected = world.bots.find((b) => b.id === selectedId);
  // Steer the picked character: while their card is open, or once steering.
  const controlling =
    selected &&
    selected.place.roomId === roomId &&
    !selected.travel &&
    selected.mode !== 'frozen' &&
    (selected.mode === 'puppet' || cardOpen)
      ? selected
      : null;
  if (decorating) {
    return (
      <div className="stage-targets">
        <DecorTargets />
        {room?.doors.map((d, i) => (
          <DoorTarget key={`${roomId}-${i}`} index={i} to={d.to} />
        ))}
      </div>
    );
  }
  return (
    <div className="stage-targets">
      {room?.furniture
        .filter((f) => offers[f.kind])
        .map((f) => (
          <FurnitureTarget
            key={`${roomId}-${f.id}`}
            id={f.id}
            kind={f.kind}
            x={f.x}
            roomId={roomId}
          />
        ))}
      {room?.doors.map((d, i) => (
        <DoorTarget key={`${roomId}-${i}`} index={i} to={d.to} />
      ))}
      <BoardTargets roomId={roomId} />
      <FloorTargets controlling={controlling} />
      <SurfaceTargets roomId={roomId} />
      <NearTargets roomId={roomId} />
      {objects.map((o) => (
        <ObjectTarget key={o.id} object={o} />
      ))}
      {bots.map((b) => (
        <BotTarget key={b.id} bot={b} />
      ))}
      <BenchHints world={world} roomId={roomId} />
      <span className="visually-hidden" aria-live="polite">
        {bots.map((b) => `${b.name}: ${doingLabel(b)}${b.now ? '' : ''}`).join('. ')}
      </span>
    </div>
  );
}
