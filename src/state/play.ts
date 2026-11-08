// What the child is doing on the play stage right now: who is selected, what is
// being carried, who the camera follows. Not saved.
import { create } from 'zustand';

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
}));
