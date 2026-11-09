// Pick-and-place (CLAUDE.md → "Every drag has a tap alternative"):
// - drag a thing and let go on a character or the floor; or
// - tap a thing to pick it up (it rides on a marigold halo), then tap where it goes.
// Valid targets glow teal; a drop that does not fit shows a red cross, never an error.
import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { game } from '../app/game';
import { hint } from '../app/hints';
import { playSfx } from '../audio/audio';
import { sim } from '../app/simRunner';
import { isCraftTool } from '../content/crafting';
import { nearSpot, surfaceOf } from '../content/furniture';
import { strings, thingName } from '../i18n';
import { benchSlotX, benchWouldMake, onBench, type BenchPut } from '../sim/workbench';
import { findRoom } from '../content/rooms';
import { furnitureUseAt } from '../sim/ads';
import { usePlay, type Carrying, type CarrySource } from '../state/play';
import { useUi } from '../state/ui';
import { clientToRoom, roomToClient } from '../stage/targets';

const DRAG_START_PX = 8;

function currentPlace(x: number, y: number) {
  const roomId = useUi.getState().roomId;
  const room = findRoom(roomId);
  return { buildingId: room?.buildingId ?? 'home', roomId, x, y };
}

/** Put the carried thing on a target key (`bot:<id>`, `floor`, `spot:<n>`). */
export function placeOn(target: string, clientX?: number, clientY?: number): boolean {
  const play = usePlay.getState();
  const c = play.carrying;
  if (!c) return false;
  let ok = false;
  // A character only goes on the floor: they appear where they were put.
  // Dropped anywhere over the room (even the wall), they land on the floor below.
  if (c.source.from === 'person') {
    let at: { x: number; y: number } | null = null;
    if (target.startsWith('spot:')) {
      at = { x: [225, 450, 675][Number(target.slice(5))] ?? 450, y: 470 };
    } else if (clientX !== undefined && clientY !== undefined) {
      const p = clientToRoom(clientX, clientY);
      // The feet go where the finger is (the figure is shown standing on it).
      if (p && p.x >= 0 && p.x <= 900 && p.y >= 0 && p.y <= 560) at = { x: p.x, y: p.y };
    }
    if (!at && target !== 'floor') return false;
    at ??= { x: 450, y: 470 };
    // Put on a sofa, a bed, the toilet, the piano…: they use it right there.
    const roomId = useUi.getState().roomId;
    const furniture = findRoom(roomId)?.furniture ?? [];
    const use =
      clientX !== undefined && !target.startsWith('spot:')
        ? furnitureUseAt(roomId, furniture, at.x, at.y)
        : null;
    if (use) {
      const { spot, ...doing } = use;
      ok = game.do({
        type: 'bring',
        botId: c.source.botId,
        place: currentPlace(spot.x, spot.y),
        use: doing,
      });
    } else ok = game.do({ type: 'bring', botId: c.source.botId, place: currentPlace(at.x, at.y) });
    if (ok) {
      playSfx('jingle');
      play.drop();
    }
    return ok;
  }
  if (target.startsWith('bot:')) {
    ok = game.do({ type: 'give', botId: target.slice(4), kind: c.kind });
    if (ok) {
      playSfx('jingle');
      hint.gave();
    }
  } else if (target.startsWith('surface:')) {
    // On a table, counter or shelf: where the finger is along the top (or the middle).
    const roomId = useUi.getState().roomId;
    const f = findRoom(roomId)?.furniture.find((x) => x.id === target.slice(8));
    const s = f ? surfaceOf(f) : null;
    if (s && f?.kind === 'workbench') {
      ok = putOnBench(f.id, c.kind, c.source, clientX, clientY);
    } else if (s) {
      const p =
        clientX !== undefined && clientY !== undefined ? clientToRoom(clientX, clientY) : null;
      const x = Math.min(s.x1, Math.max(s.x0, p?.x ?? (s.x0 + s.x1) / 2));
      const place = currentPlace(x, s.floorY);
      const raise = Math.max(0, s.floorY - s.top);
      ok =
        c.source.from === 'object'
          ? game.do({ type: 'moveObject', id: c.source.objectId, place, raise })
          : game.do({ type: 'placeObject', kind: c.kind, place, raise });
      if (ok) playSfx('place');
    }
  } else if (target.startsWith('near:')) {
    // In front of a piece it suits (a ball by the toy box): right there.
    const f = findRoom(useUi.getState().roomId)?.furniture.find((x) => x.id === target.slice(5));
    if (f) {
      const at = nearSpot(f);
      const place = currentPlace(at.x, at.y);
      ok =
        c.source.from === 'object'
          ? game.do({ type: 'moveObject', id: c.source.objectId, place })
          : game.do({ type: 'placeObject', kind: c.kind, place });
      if (ok) playSfx('place');
    }
  } else if (target === 'floor' || target.startsWith('spot:')) {
    let at: { x: number; y: number } | null = null;
    // A floor spot puts it right there; a tap or drop on the floor puts its base just
    // below the pointer, so it lands where the finger is.
    if (target.startsWith('spot:')) {
      at = { x: [225, 450, 675][Number(target.slice(5))] ?? 450, y: 452 };
    } else if (clientX !== undefined && clientY !== undefined) {
      const p = clientToRoom(clientX, clientY);
      at = p ? { x: p.x, y: p.y + 20 } : null;
    }
    at ??= { x: 450, y: 450 };
    const place = currentPlace(at.x, at.y);
    ok =
      c.source.from === 'object'
        ? game.do({ type: 'moveObject', id: c.source.objectId, place })
        : game.do({ type: 'placeObject', kind: c.kind, place });
    if (ok) playSfx('place');
  }
  if (ok) play.drop();
  return ok;
}

/**
 * Put the carried thing on a workbench (sim/workbench.ts). If it makes something:
 * a rising sparkle and the new thing on the bench; a tool alone knocks on the wood
 * (and the bench shows faded pictures of what is missing). Never a "no".
 */
function putOnBench(
  benchId: string,
  kind: string,
  source: CarrySource,
  clientX?: number,
  clientY?: number,
): boolean {
  const roomId = useUi.getState().roomId;
  const p = clientX !== undefined && clientY !== undefined ? clientToRoom(clientX, clientY) : null;
  const cmd: BenchPut = {
    type: 'benchPut',
    roomId,
    benchId,
    kind,
    x: benchSlotX(
      sim.world,
      roomId,
      benchId,
      p?.x ?? 0,
      source.from === 'object' ? source.objectId : undefined,
    ),
    ...(source.from === 'object' ? { objectId: source.objectId } : {}),
  };
  const recipe = benchWouldMake(sim.world, cmd);
  if (!game.do(cmd)) return false;
  // The sparkle goes where the new thing stands (or the thing just put down).
  const here = onBench(sim.world, roomId, benchId);
  const spot = (recipe ? here.filter((o) => o.kind === recipe.makes) : here).at(-1);
  const at = spot ? roomToClient(spot.place.x, spot.place.y - (spot.raise ?? 0) - 40) : null;
  if (recipe) {
    playSfx('craft');
    if (at) usePlay.getState().showBurst(at.x, at.y, recipe.makes);
    useUi.getState().toast('sparkle', strings.workshop.made(thingName(recipe.makes)));
  } else if (isCraftTool(kind)) {
    playSfx('knock');
    if (at) usePlay.getState().showBurst(at.x, at.y, null);
  } else {
    playSfx('place');
  }
  return true;
}

/** A drop that did not land anywhere useful: a gentle "no" and the thing goes back. */
export function missed(clientX: number, clientY: number): void {
  playSfx('invalid');
  usePlay.getState().markInvalid(clientX, clientY);
  usePlay.getState().drop();
}

export function pickUp(kind: string, source: CarrySource, mode: Carrying['mode']): void {
  playSfx('pick');
  usePlay.getState().pickUp({ kind, source, mode });
  hint.pickedUp(kind);
  // On phones the drawer is a sheet: close it so the stage is free to tap.
  useUi.getState().setPlusSheetOpen(false);
}

export function dropCarried(): void {
  if (!usePlay.getState().carrying) return;
  playSfx('soft');
  usePlay.getState().drop();
  hint.dropped();
}

/** Remove a placed thing the child is carrying (after a press-and-hold). */
export function putAwayCarried(): void {
  const c = usePlay.getState().carrying;
  if (c?.source.from !== 'object') return;
  game.do({ type: 'removeObject', id: c.source.objectId });
  usePlay.getState().drop();
}

function targetAt(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY);
  const target = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-target]') : null;
  return target?.dataset.target ?? null;
}

/**
 * Pointer handlers for something that can be carried (a drawer tile, a thing on the
 * floor). A tap picks it up; a drag carries it under the pointer.
 */
export function useCarrySource(kind: string, source: CarrySource, onTap?: () => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragging = useRef(false);
  /** The browser sends a click after a drag ends on the same element: ignore it. */
  const justDragged = useRef(false);

  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      dragging.current = false;
      // A finger's drag sends no click afterwards (a mouse's does), so a new press
      // forgets the last drag; otherwise the next real tap would be swallowed.
      justDragged.current = false;
      // Capture at once: a quick drag can leave a small button before it counts
      // as a drag, and its moves would then go to whatever is underneath.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Not capturable (synthetic event): moves over the button still work.
      }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      if (!dragging.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_START_PX) {
        dragging.current = true;
        pickUp(kind, source, 'drag');
      }
      if (dragging.current) usePlay.getState().setDragAt({ x: e.clientX, y: e.clientY });
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const wasDragging = dragging.current;
      start.current = null;
      dragging.current = false;
      if (!wasDragging) return;
      justDragged.current = true;
      // Let go over a dock or the sheet: it simply goes back, no "no".
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (under?.closest('.dock, .sheet') && !targetAt(e.clientX, e.clientY)) {
        dropCarried();
        return;
      }
      // 'room' is anywhere over the room: only a carried person accepts it.
      const target = targetAt(e.clientX, e.clientY) ?? 'room';
      if (!placeOn(target, e.clientX, e.clientY)) missed(e.clientX, e.clientY);
    },
    onPointerCancel: () => {
      start.current = null;
      if (dragging.current) usePlay.getState().drop();
      dragging.current = false;
    },
    /**
     * A tap (no drag): pick it up, or put it back if it is already in hand; or,
     * with `onTap` (a character in the room), whatever a tap means there.
     */
    onClick: () => {
      if (justDragged.current) {
        justDragged.current = false;
        return;
      }
      if (onTap) {
        onTap();
        return;
      }
      const c = usePlay.getState().carrying;
      const same = c?.kind === kind && JSON.stringify(c.source) === JSON.stringify(source);
      if (same) dropCarried();
      else pickUp(kind, source, 'tap');
    },
  };
}

/** Is any bot in this room something the carried thing could go to? (Everyone can take a gift.) */
export function botsHere(): string[] {
  const roomId = useUi.getState().roomId;
  return sim.world.bots.filter((b) => !b.travel && b.place.roomId === roomId).map((b) => b.id);
}
