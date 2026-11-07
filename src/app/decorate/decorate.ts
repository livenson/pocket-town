// Decorating actions shared by the targets, the drawer and the toolbar.
import { playSfx } from '../../audio/audio';
import {
  anchorAt,
  clampFurniture,
  type FurnitureInstance,
  type FurnitureKindId,
} from '../../content/furniture';
import { findRoom } from '../../content/rooms';
import { useDecor } from '../../state/decor';
import { useUi } from '../../state/ui';
import { game } from '../game';

let counter = 0;
/** A fresh id for a piece the child adds. */
export const newPieceId = () => `d${Date.now().toString(36)}${(counter++).toString(36)}`;

export const currentRoomId = () => useUi.getState().roomId;

export function pieceById(id: string | null): FurnitureInstance | undefined {
  if (!id) return undefined;
  return findRoom(currentRoomId())?.furniture.find((f) => f.id === id);
}

/** Where a piece would go with the finger at (px, py), kept where it can stand. */
export function pieceAt(
  base: Omit<FurnitureInstance, 'x' | 'y'>,
  px: number,
  py: number,
): FurnitureInstance {
  const at = anchorAt(base.kind, px, py, base.scale ?? 1);
  const f = { ...base, ...at };
  return { ...f, ...clampFurniture(f) };
}

export function addPiece(kind: FurnitureKindId, px: number, py: number): void {
  const piece = pieceAt({ id: newPieceId(), kind }, px, py);
  if (game.do({ type: 'addFurniture', roomId: currentRoomId(), piece })) {
    playSfx('place');
    useDecor.getState().select(piece.id);
  }
}

export function movePiece(f: FurnitureInstance, to: { x: number; y: number }, flip = f.flip): void {
  if (game.do({ type: 'moveFurniture', roomId: currentRoomId(), id: f.id, ...to, flip })) {
    playSfx('place');
  }
}

export function turnPiece(f: FurnitureInstance): void {
  movePiece(f, { x: f.x, y: f.y }, !f.flip);
}

export function copyPiece(f: FurnitureInstance): void {
  const piece = { ...f, id: newPieceId(), x: f.x + 60, y: f.y };
  if (game.do({ type: 'addFurniture', roomId: currentRoomId(), piece })) {
    playSfx('place');
    useDecor.getState().select(piece.id);
  }
}

export function removePiece(f: FurnitureInstance): void {
  if (game.do({ type: 'removeFurniture', roomId: currentRoomId(), id: f.id })) {
    useDecor.getState().select(null);
  }
}
