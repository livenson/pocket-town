// Decorating a room in place: which piece is picked, what is being carried from
// the furniture catalogue, and the drag preview. Transient; the room itself is in
// the world (world.roomEdits).
import { create } from 'zustand';
import type { FurnitureInstance, FurnitureKindId } from '../content/furniture';

interface DecorStore {
  on: boolean;
  /** A placed piece the child picked (marigold outline; turn, copy, remove, move). */
  selectedId: string | null;
  /** A piece picked from the catalogue with a tap: the next tap in the room places it. */
  carryingKind: FurnitureKindId | null;
  /** While dragging: where the piece would go. */
  preview: FurnitureInstance | null;
  setOn: (on: boolean) => void;
  select: (id: string | null) => void;
  carry: (kind: FurnitureKindId | null) => void;
  setPreview: (f: FurnitureInstance | null) => void;
}

export const useDecor = create<DecorStore>()((set) => ({
  on: false,
  selectedId: null,
  carryingKind: null,
  preview: null,
  setOn: (on) => set({ on, selectedId: null, carryingKind: null, preview: null }),
  select: (selectedId) => set({ selectedId, carryingKind: null }),
  carry: (carryingKind) => set({ carryingKind, selectedId: null }),
  setPreview: (preview) => set({ preview }),
}));
