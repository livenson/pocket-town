// Transient UI state: current screen, time control, overlays, toasts. Not persisted.
import { create } from 'zustand';
import { initialNav, navigate, type NavEvent, type NavState, type ScreenId } from '../app/machine';
import type { IconName } from '../design/icons';
import type { Moment } from '../sim/away';

export type TimeSpeed = 'pause' | 'play' | 'fast';

export interface StageView {
  canLeft: boolean;
  canRight: boolean;
  /** Room x at the middle of the screen. */
  centreX: number;
  /** How much of the room's width fits on screen, in room units. */
  span: number;
}

export interface ToastMessage {
  id: number;
  icon: IconName;
  label: string;
}

interface UiStore {
  nav: NavState;
  /** The room the play stage is looking at. */
  roomId: string;
  setRoom: (roomId: string) => void;
  /** Where the child asked the camera to look (room x), or null to follow as usual. */
  lookX: number | null;
  setLookX: (x: number | null) => void;
  /** What the stage can show: more room to either side, and the room x in the middle. */
  view: StageView;
  setView: (view: StageView) => void;
  /** The house open in the house wizard (null: building a new one). */
  editingHouseId: string | null;
  setEditingHouse: (id: string | null) => void;
  /** "While you were away" moments to show, or null. */
  postcard: Moment[] | null;
  setPostcard: (moments: Moment[] | null) => void;
  time: TimeSpeed;
  shortcutsOpen: boolean;
  plusSheetOpen: boolean;
  toasts: ToastMessage[];
  dispatch: (event: NavEvent) => void;
  go: (to: ScreenId) => void;
  back: () => void;
  home: () => void;
  setTime: (time: TimeSpeed) => void;
  togglePause: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setPlusSheetOpen: (open: boolean) => void;
  toast: (icon: IconName, label: string) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;
const TOAST_MS = 2600;

function initialNavFromHash(): NavState {
  // Hidden component kit for visual checks: harmless, so no gate for the hash route.
  if (typeof location !== 'undefined' && location.hash === '#kit') {
    return { ...initialNav, screen: 'kit', unlocked: true };
  }
  // Straight into the play stage, for visual checks and tests.
  if (typeof location !== 'undefined' && location.hash === '#scene') {
    return { ...initialNav, screen: 'scene', history: ['hub'] };
  }
  return initialNav;
}

export const useUi = create<UiStore>()((set, get) => ({
  nav: initialNavFromHash(),
  roomId: 'home-living',
  // A new room starts with the camera following as usual.
  setRoom: (roomId) => set((s) => (s.roomId === roomId ? {} : { roomId, lookX: null })),
  lookX: null,
  setLookX: (lookX) => set({ lookX }),
  view: { canLeft: false, canRight: false, centreX: 450, span: 900 },
  setView: (view) => {
    const v = get().view;
    if (
      v.canLeft !== view.canLeft ||
      v.canRight !== view.canRight ||
      Math.abs(v.centreX - view.centreX) > 1 ||
      Math.abs(v.span - view.span) > 1
    )
      set({ view });
  },
  editingHouseId: null,
  setEditingHouse: (editingHouseId) => set({ editingHouseId }),
  postcard: null,
  setPostcard: (postcard) => set({ postcard }),
  time: 'play',
  shortcutsOpen: false,
  plusSheetOpen: false,
  toasts: [],
  dispatch: (event) => set((s) => ({ nav: navigate(s.nav, event), plusSheetOpen: false })),
  go: (to) => get().dispatch({ type: 'go', to }),
  back: () => get().dispatch({ type: 'back' }),
  home: () => get().dispatch({ type: 'home' }),
  setTime: (time) => set({ time }),
  togglePause: () => set((s) => ({ time: s.time === 'pause' ? 'play' : 'pause' })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setPlusSheetOpen: (plusSheetOpen) => set({ plusSheetOpen }),
  toast: (icon, label) => {
    const id = ++toastId;
    // The same message again replaces the one showing (repeated taps never stack it).
    set((s) => ({
      toasts: [...s.toasts.filter((t) => t.label !== label).slice(-2), { id, icon, label }],
    }));
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
