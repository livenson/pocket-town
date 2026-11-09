// What the child is doing on the play stage right now: who is selected, what is
// being carried, who the camera follows. Not saved.
import { create } from 'zustand';
import type { BurstKind } from '../content/placeIdeas';

export type CarrySource =
  | { from: 'drawer' }
  | { from: 'object'; objectId: string }
  /** A character brought into the room from the characters dock. */
  | { from: 'person'; botId: string };

/** The kind used while carrying a character (not a thing). */
export const PERSON = 'person';

export interface Carrying {
  kind: string;
  source: CarrySource;
  /** 'drag': follows the pointer; 'tap': picked up with a tap, placed with a tap. */
  mode: 'drag' | 'tap';
}

interface PlayStore {
  selectedBotId: string | null;
  cardOpen: boolean;
  carrying: Carrying | null;
  /** Pointer position while dragging (client px). */
  dragAt: { x: number; y: number } | null;
  followBotId: string | null;
  /** Buildings the followed bot has been in, oldest first. */
  breadcrumb: string[];
  /** A brief red-cross mark where a drop did not fit. */
  invalidAt: { x: number; y: number; id: number } | null;
  cameraOpen: boolean;
  /** A little making burst at the workbench (client px): sparkles, or a tool's knock. */
  burst: { x: number; y: number; id: number; made: string | null } | null;
  /** A moment's burst where a thing was put in one of its places (client px). */
  moment: { x: number; y: number; id: number; kind: BurstKind } | null;
  /** The garage car-fixing minigame: which car (`<roomId>:<pieceId>`), or null. */
  carFix: string | null;

  select: (botId: string | null) => void;
  openCard: (botId: string) => void;
  closeCard: () => void;
  pickUp: (c: Carrying) => void;
  drop: () => void;
  setDragAt: (p: { x: number; y: number } | null) => void;
  follow: (botId: string | null) => void;
  addCrumb: (buildingId: string) => void;
  markInvalid: (x: number, y: number) => void;
  setCameraOpen: (open: boolean) => void;
  showBurst: (x: number, y: number, made: string | null) => void;
  showMoment: (x: number, y: number, kind: BurstKind) => void;
  setCarFix: (key: string | null) => void;
}

let invalidId = 0;

export const usePlay = create<PlayStore>()((set) => ({
  selectedBotId: null,
  cardOpen: false,
  carrying: null,
  dragAt: null,
  followBotId: null,
  breadcrumb: [],
  invalidAt: null,
  cameraOpen: false,
  burst: null,
  moment: null,
  carFix: null,

  select: (selectedBotId) => set({ selectedBotId }),
  openCard: (botId) => set({ selectedBotId: botId, cardOpen: true, carrying: null }),
  closeCard: () => set({ cardOpen: false }),
  pickUp: (carrying) => set({ carrying, cardOpen: false }),
  drop: () => set({ carrying: null, dragAt: null }),
  setDragAt: (dragAt) => set({ dragAt }),
  follow: (followBotId) => set({ followBotId, breadcrumb: [], cardOpen: false }),
  addCrumb: (buildingId) =>
    set((s) =>
      s.breadcrumb.at(-1) === buildingId
        ? s
        : { breadcrumb: [...s.breadcrumb, buildingId].slice(-5) },
    ),
  markInvalid: (x, y) => set({ invalidAt: { x, y, id: ++invalidId } }),
  setCameraOpen: (cameraOpen) => set({ cameraOpen, carrying: null }),
  showBurst: (x, y, made) => set({ burst: { x, y, made, id: ++invalidId } }),
  showMoment: (x, y, kind) => set({ moment: { x, y, kind, id: ++invalidId } }),
  setCarFix: (carFix) => set({ carFix, carrying: null, cardOpen: false }),
}));
