// Decorating on the stage: every piece (but the doors) is a button that can be
// picked with a tap and dragged; the room itself takes the tap that places a new
// piece or moves the picked one. Keyboard: arrows move, R turns, C copies.
import { useEffect, useRef, type PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { clampFurniture, fixedKinds, type FurnitureInstance } from '../../content/furniture';
import { findRoom } from '../../content/rooms';
import { strings } from '../../i18n';
import { useDecor } from '../../state/decor';
import { useUi } from '../../state/ui';
import { clientToRoom, registerTarget } from '../../stage/targets';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { useGame } from '../game';
import { addPiece, copyPiece, movePiece, pieceAt, pieceById, turnPiece } from './decorate';

const DRAG_PX = 8;
const nameOf = (kind: string) => strings.furnitureNames[kind] ?? kind;

function PieceTarget({ f }: { f: FurnitureInstance }) {
  const selected = useDecor((s) => s.selectedId === f.id);
  const label = selected
    ? strings.decorate.picked(nameOf(f.kind))
    : strings.decorate.piece(nameOf(f.kind));
  const voice = useVoiceLabel(label);
  const drag = useRef<{
    sx: number;
    sy: number;
    offX: number;
    offY: number;
    moved: boolean;
  } | null>(null);
  const justDragged = useRef(false);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const p = clientToRoom(e.clientX, e.clientY);
    if (!p) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, offX: p.x - f.x, offY: p.y - f.y, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_PX) return;
    d.moved = true;
    const p = clientToRoom(e.clientX, e.clientY);
    if (!p) return;
    const next = { ...f, x: p.x - d.offX, y: p.y - d.offY };
    useDecor.getState().setPreview({ ...next, ...clampFurniture(next) });
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    justDragged.current = true;
    const to = useDecor.getState().preview;
    useDecor.getState().setPreview(null);
    if (to) movePiece(f, to);
    useDecor.getState().select(f.id);
  };
  const onPointerCancel = () => {
    drag.current = null;
    useDecor.getState().setPreview(null);
  };

  return (
    <button
      ref={(el) => registerTarget(`piece:${f.id}`, el)}
      type="button"
      className="stage-target stage-target--piece"
      data-selected={selected || undefined}
      aria-label={label}
      aria-pressed={selected}
      {...voice}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={() => {
        if (justDragged.current) {
          justDragged.current = false;
          return;
        }
        playSfx('pick');
        useDecor.getState().select(selected ? null : f.id);
      }}
    />
  );
}

/** The whole room: where a tap puts the carried piece, or moves the picked one. */
function RoomTarget() {
  const carrying = useDecor((s) => s.carryingKind);
  const selectedId = useDecor((s) => s.selectedId);
  const active = carrying !== null || selectedId !== null;
  const label = carrying ? strings.decorate.carrying(nameOf(carrying)) : strings.decorate.room;
  return (
    <button
      ref={(el) => registerTarget('decor-room', el)}
      type="button"
      className="stage-target stage-target--decor-room"
      data-valid={active || undefined}
      aria-label={label}
      tabIndex={active ? 0 : -1}
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        // A keyboard press has no position: use the middle of the floor.
        const p =
          e.detail > 0
            ? clientToRoom(e.clientX, e.clientY)
            : clientToRoom(box.left + box.width / 2, box.top + box.height * 0.8);
        if (!p) return;
        const state = useDecor.getState();
        if (state.carryingKind) {
          addPiece(state.carryingKind, p.x, p.y);
          return;
        }
        const picked = pieceById(state.selectedId);
        if (picked) {
          const to = pieceAt(picked, p.x, p.y);
          movePiece(picked, to);
        }
      }}
    />
  );
}

/** Arrows nudge the picked piece; R turns it; C copies it; Esc lets go. */
function useDecorKeys(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useDecor.getState();
      const f = pieceById(state.selectedId);
      if (e.key === 'Escape' && (state.selectedId || state.carryingKind)) {
        e.stopPropagation();
        state.select(null);
        return;
      }
      if (!f || e.ctrlKey || e.metaKey || e.altKey) return;
      const step = e.shiftKey ? 5 : 20;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        e.stopPropagation();
        movePiece(f, { x: f.x + m[0], y: f.y + m[1] });
      } else if (e.key === 'r' || e.key === 'R') {
        e.stopPropagation();
        turnPiece(f);
      } else if (e.key === 'c' || e.key === 'C') {
        e.stopPropagation();
        copyPiece(f);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

export function DecorTargets() {
  const roomId = useUi((s) => s.roomId);
  // Redraw when the room's furniture changes (decorating, undo, redo).
  useGame((s) => s.version);
  useDecorKeys();
  const room = findRoom(roomId);
  return (
    <>
      <RoomTarget />
      {room?.furniture
        .filter((f) => !fixedKinds.includes(f.kind))
        .map((f) => (
          <PieceTarget key={`${roomId}-${f.id}`} f={f} />
        ))}
    </>
  );
}
