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
import { findRoom } from '../content/rooms';
import { usePlay, type Carrying, type CarrySource } from '../state/play';
import { useUi } from '../state/ui';
import { clientToRoom } from '../stage/targets';

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
  if (target.startsWith('bot:')) {
    ok = game.do({ type: 'give', botId: target.slice(4), kind: c.kind });
    if (ok) {
      playSfx('jingle');
      hint.gave();
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
export function useCarrySource(kind: string, source: CarrySource) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragging = useRef(false);
  /** The browser sends a click after a drag ends on the same element: ignore it. */
  const justDragged = useRef(false);

  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      dragging.current = false;
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      if (!dragging.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_START_PX) {
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
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
      const target = targetAt(e.clientX, e.clientY);
      if (!(target && placeOn(target, e.clientX, e.clientY))) missed(e.clientX, e.clientY);
    },
    onPointerCancel: () => {
      start.current = null;
      if (dragging.current) usePlay.getState().drop();
      dragging.current = false;
    },
    /** A tap (no drag): pick it up, or put it back if it is already in hand. */
    onClick: () => {
      if (justDragged.current) {
        justDragged.current = false;
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
