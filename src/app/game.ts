// The one way the UI changes the world: child commands go through the undo history
// and trigger an autosave. Loading restores the last good save at startup.
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { playSfx } from '../audio/audio';
import { loadSave, writeSave } from '../persist/save';
import type { Command } from '../sim/commands';
import { History } from '../sim/history';
import type { World } from '../sim/types';
import { useUi } from '../state/ui';
import { sim } from './simRunner';

const AUTOSAVE_DEBOUNCE_MS = 1000;
const AUTOSAVE_EVERY_MS = 30_000;

interface GameState {
  canUndo: boolean;
  canRedo: boolean;
  /** Bumps on every child change (for components that show world state). */
  version: number;
  loaded: boolean;
}

export const useGame = create<GameState>()(() => ({
  canUndo: false,
  canRedo: false,
  version: 0,
  loaded: false,
}));

const history = new History();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function changed(): void {
  useGame.setState((s) => ({
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    version: s.version + 1,
  }));
  scheduleSave();
}

export function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveNow(), AUTOSAVE_DEBOUNCE_MS);
}

export async function saveNow(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  try {
    await writeSave(sim.world, { roomId: useUi.getState().roomId });
  } catch {
    // Storage full or blocked: keep playing; the next save tries again.
  }
}

export const game = {
  /** Do something the child asked for. Returns false when it does not apply. */
  do(cmd: Command): boolean {
    const ok = history.do(sim.world, cmd);
    if (ok) changed();
    return ok;
  },
  undo(): void {
    if (history.undo(sim.world)) {
      playSfx('soft');
      changed();
    }
  },
  redo(): void {
    if (history.redo(sim.world)) {
      playSfx('tap');
      changed();
    }
  },
  get world(): World {
    return sim.world;
  },
};

/** Load the saved town (if any) and keep saving it. Call once at startup. */
export async function startGame(): Promise<void> {
  // ?seed and ?still are for tests and screenshots: they start from a fresh town.
  const params = new URLSearchParams(location.search);
  const fresh = params.has('seed') || params.has('still');
  const save = fresh ? null : await loadSave().catch(() => null);
  if (save) {
    sim.load(save.world);
    useUi.getState().setRoom(save.ui.roomId);
  }
  useGame.setState({ loaded: true });
  if (fresh) return;
  setInterval(() => void saveNow(), AUTOSAVE_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void saveNow();
  });
  window.addEventListener('pagehide', () => void saveNow());
}

/** Re-render a component as the world changes, at most `fps` times a second. */
export function useWorldTick(fps = 4): World {
  const [, setTick] = useState(0);
  const version = useGame((s) => s.version);
  useEffect(() => {
    let last = 0;
    return sim.subscribe(() => {
      const now = performance.now();
      if (now - last < 1000 / fps) return;
      last = now;
      setTick((t) => t + 1);
    });
  }, [fps]);
  void version;
  return sim.world;
}
