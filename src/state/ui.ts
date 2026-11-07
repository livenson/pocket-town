// Transient UI state: current screen, time control, overlays, toasts. Not persisted.
import { create } from 'zustand';
import { initialNav, navigate, type NavEvent, type NavState, type ScreenId } from '../app/machine';
import type { IconName } from '../design/icons';

export type TimeSpeed = 'pause' | 'play' | 'fast';

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
  setRoom: (roomId) => set({ roomId }),
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
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, icon, label }] }));
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
