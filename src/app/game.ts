// The one way the UI changes the world: child commands go through the undo history
// and trigger an autosave. Loading restores the last good save at startup.
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { playSfx } from '../audio/audio';
import { loadSave, writeSave } from '../persist/save';
import type { Command } from '../sim/commands';
import { AWAY_MIN_MS, awayGameMinutes, catchUp } from '../sim/away';
import { History } from '../sim/history';
import type { World } from '../sim/types';
import { createWorld, entryRoom, makeBot } from '../sim/world';
import { useCreation } from '../state/creation';
import { newProfileId, useProfiles, type Profile } from '../state/profiles';
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
/** Whose town is open (null: the shared town used before profiles, and by tests). */
let profileId: string | null = null;
/** Tests and screenshots (?seed, ?still) never write saves. */
let saving = true;

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
  if (!saving) return;
  try {
    await writeSave(sim.world, { roomId: useUi.getState().roomId }, profileId);
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

/**
 * Back after a while: catch the town up on the time away (capped at two game days)
 * and show the postcard of what happened.
 */
export function comeBack(world: World, awayMs: number): void {
  if (awayMs < AWAY_MIN_MS) return;
  const moments = catchUp(world, awayGameMinutes(awayMs));
  if (moments.length > 0) useUi.getState().setPostcard(moments);
}

/** The player's own character lives in the starter house like everyone else. */
export function playerBotId(profile: Pick<Profile, 'id'>): string {
  return `me-${profile.id}`;
}

function ensurePlayerBot(world: World, profile: Profile): void {
  const id = playerBotId(profile);
  const existing = world.bots.find((b) => b.id === id);
  if (existing) {
    existing.name = profile.name;
    existing.appearance = profile.appearance;
    existing.traits = profile.traits;
    return;
  }
  const room = entryRoom('home');
  world.bots.push(
    makeBot(
      {
        id,
        name: profile.name,
        appearance: profile.appearance,
        traits: profile.traits,
        homeId: 'home',
      },
      { buildingId: 'home', roomId: room.id, x: 620, y: 470 },
    ),
  );
}

/**
 * Open a player's town: their save if they have one, otherwise a fresh town (the
 * very first player inherits a town saved before profiles existed).
 */
export async function enterProfile(id: string): Promise<void> {
  await saveNow();
  const { profiles } = useProfiles.getState();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return;
  useProfiles.getState().choose(id);
  let save = await loadSave(id).catch(() => null);
  if (!save && profiles.length === 1) save = await loadSave(null).catch(() => null);
  const world = save?.world ?? createWorld((Date.now() % 2147483647) | 0);
  ensurePlayerBot(world, profile);
  if (save) comeBack(world, Date.now() - save.savedAt);
  profileId = id;
  history.clear();
  sim.load(world);
  useUi.getState().setRoom(save?.ui.roomId ?? 'home-living');
  changed();
}

/** Load the saved town (if any) and keep saving it. Call once at startup. */
export async function startGame(): Promise<void> {
  // ?seed and ?still are for tests and screenshots: they start from a fresh town.
  const params = new URLSearchParams(location.search);
  const fresh = params.has('seed') || params.has('still');
  saving = !fresh;
  const save = fresh ? null : await loadSave(null).catch(() => null);
  if (save) {
    // The town from before profiles: only caught up when opened straight into play.
    if (location.hash === '#scene') comeBack(save.world, Date.now() - save.savedAt);
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

/** Save what the avatar wizard made: a new character, or changes to one. */
export function saveCharacter(): void {
  const c = useCreation.getState();
  const t = c.target;
  if (t.kind === 'newBot') {
    game.do({
      type: 'addBot',
      id: `c${Date.now().toString(36)}`,
      name: c.name,
      appearance: c.appearance,
      traits: c.traits,
      homeId: 'home',
    });
  } else if (t.kind === 'editBot') {
    game.do({
      type: 'updateBot',
      botId: t.botId,
      name: c.name,
      appearance: c.appearance,
      traits: c.traits,
    });
    // Changing your own character changes your profile face too.
    const { profiles, activeId } = useProfiles.getState();
    const me = profiles.find((p) => p.id === activeId);
    if (me && playerBotId(me) === t.botId) {
      useProfiles
        .getState()
        .update(me.id, { name: c.name, appearance: c.appearance, traits: c.traits });
    }
  }
}

/** Make the new player from the profile being created, and open their town. */
export async function finishCreation(): Promise<void> {
  const c = useCreation.getState();
  const id = newProfileId();
  useProfiles.getState().add({
    id,
    name: c.name,
    appearance: c.appearance,
    traits: c.traits,
    age: c.age,
    hintsDone: false,
    createdAt: Date.now(),
  });
  await enterProfile(id);
}
