// When Claude changes the code, the dev server may reload the page. Put the kid
// back where they were (same player, same screen, same room) instead of the splash.
import { enterProfile, useGame } from '../../app/game';
import type { ScreenId } from '../../app/machine';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';

const KEY = 'pt-feedback-where';
/** Screens that only need a player to be open. */
export const SAFE: ScreenId[] = ['scene', 'hub', 'map', 'characters'];

interface Where {
  activeId: string;
  screen: ScreenId;
  roomId: string;
}

function read(): Where | null {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (typeof v !== 'object' || v === null) return null;
    if (!('activeId' in v && 'screen' in v && 'roomId' in v)) return null;
    const screen = SAFE.find((s) => s === v.screen);
    return typeof v.activeId === 'string' && typeof v.roomId === 'string' && screen
      ? { activeId: v.activeId, screen, roomId: v.roomId }
      : null;
  } catch {
    return null;
  }
}

function remember(): void {
  const { nav, roomId } = useUi.getState();
  const { activeId } = useProfiles.getState();
  if (!activeId || !SAFE.includes(nav.screen)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ activeId, screen: nav.screen, roomId }));
  } catch {
    // Private mode: nothing to restore next time, which is fine.
  }
}

const until = (ok: () => boolean, subscribe: (cb: () => void) => () => void) =>
  new Promise<void>((resolve) => {
    if (ok()) return resolve();
    const stop = subscribe(() => {
      if (!ok()) return;
      stop();
      resolve();
    });
  });

/** Jump to a screen that only needs a player (for "show me", too). */
export function goTo(screen: string | undefined, roomId: string | undefined): void {
  if (roomId) useUi.getState().setRoom(roomId);
  const to = SAFE.find((s) => s === screen);
  if (!to) return;
  useUi.setState((s) => ({
    nav: {
      ...s.nav,
      screen: to,
      history: to === 'hub' ? [] : ['hub'],
      gateTarget: null,
      unlocked: false,
    },
  }));
}

export async function restoreWhere(): Promise<void> {
  const where = read();
  useUi.subscribe(remember);
  if (!where || location.hash) return;
  await until(
    () => useProfiles.persist.hasHydrated() && useGame.getState().loaded,
    (cb) => {
      const a = useProfiles.persist.onFinishHydration(cb);
      const b = useGame.subscribe(cb);
      return () => {
        a();
        b();
      };
    },
  );
  if (!useProfiles.getState().profiles.some((p) => p.id === where.activeId)) return;
  // Only if the kid has not started tapping on their own meanwhile.
  if (useUi.getState().nav.screen !== 'splash') return;
  await enterProfile(where.activeId);
  goTo(where.screen, where.roomId);
}
