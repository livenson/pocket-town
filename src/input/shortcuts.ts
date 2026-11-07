// Desktop keyboard shortcuts (DESIGN.md → "Desktop keyboard shortcuts").
import { useEffect } from 'react';
import { playSfx } from '../audio/audio';
import { game } from '../app/game';
import { hint } from '../app/hints';
import { usePlay } from '../state/play';
import { useUi } from '../state/ui';
import { dropCarried } from './carry';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Space and Enter belong to the focused control, if any. */
function focusOnControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, [role="switch"]') !== null;
}

export type ShortcutAction =
  | 'home'
  | 'map'
  | 'edit'
  | 'togglePause'
  | 'faster'
  | 'camera'
  | 'undo'
  | 'redo'
  | 'escape'
  | 'help'
  | 'nextTarget'
  | 'previousTarget';

/** Map a key event to an action (pure; unit-tested). */
export function shortcutFor(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'target'>,
): ShortcutAction | null {
  if (isTyping(e.target)) return null;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (mod && key === 'z') return e.shiftKey ? 'redo' : 'undo';
  if (mod && key === 'y') return 'redo';
  if (mod || e.altKey) return null;
  switch (key) {
    case 'h':
      return 'home';
    case 'm':
      return 'map';
    case 'e':
      return 'edit';
    case 'f':
      return 'faster';
    case 'c':
      return 'camera';
    case ' ':
      return focusOnControl(e.target) ? null : 'togglePause';
    case 'escape':
      return 'escape';
    case 'arrowright':
    case 'arrowdown':
      return 'nextTarget';
    case 'arrowleft':
    case 'arrowup':
      return 'previousTarget';
    case '?':
      return 'help';
    default:
      return null;
  }
}

/** Screens where play-time shortcuts (map, edit, time, camera) apply. */
const PLAY_SCREENS = new Set(['scene', 'map', 'hub']);
const NO_HOME = new Set(['splash', 'age', 'profile', 'diceAvatar', 'hooray', 'gate']);

/**
 * While carrying something, the arrow keys move between the places it can go
 * (characters and floor spots); Enter puts it there.
 */
function moveTargetFocus(direction: 1 | -1): boolean {
  if (!usePlay.getState().carrying) return false;
  const targets = [...document.querySelectorAll<HTMLElement>('.stage-targets [data-valid]')].filter(
    (el) => el.tabIndex >= 0,
  );
  if (targets.length === 0) return false;
  const active = document.activeElement;
  const i = active instanceof HTMLElement ? targets.indexOf(active) : -1;
  const next = targets[(i + direction + targets.length) % targets.length];
  next?.focus();
  return true;
}

export function runShortcut(action: ShortcutAction): boolean {
  const ui = useUi.getState();
  const play = usePlay.getState();
  const screen = ui.nav.screen;
  switch (action) {
    case 'help':
      ui.setShortcutsOpen(!ui.shortcutsOpen);
      return true;
    case 'nextTarget':
    case 'previousTarget':
      return moveTargetFocus(action === 'nextTarget' ? 1 : -1);
    case 'escape':
      if (ui.shortcutsOpen) ui.setShortcutsOpen(false);
      else if (play.carrying) dropCarried();
      else if (play.cameraOpen) play.setCameraOpen(false);
      else if (play.cardOpen) play.closeCard();
      else if (play.followBotId) play.follow(null);
      else if (ui.plusSheetOpen) ui.setPlusSheetOpen(false);
      else if (screen !== 'scene' && screen !== 'splash' && screen !== 'hub') ui.back();
      else return false;
      return true;
    case 'home':
      if (NO_HOME.has(screen)) return false;
      ui.home();
      return true;
    case 'map':
      if (!PLAY_SCREENS.has(screen) || screen === 'map') return false;
      hint.mapOpened();
      ui.go('map');
      return true;
    case 'edit':
      if (screen !== 'scene') return false;
      ui.go('houseWizard');
      return true;
    case 'camera':
      if (screen !== 'scene') return false;
      play.setCameraOpen(true);
      return true;
    case 'togglePause':
      if (screen !== 'scene') return false;
      ui.togglePause();
      return true;
    case 'faster':
      if (screen !== 'scene') return false;
      ui.setTime(ui.time === 'fast' ? 'play' : 'fast');
      return true;
    case 'undo':
      game.undo();
      return true;
    case 'redo':
      game.redo();
      return true;
  }
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const action = shortcutFor(e);
      if (!action) return;
      if (runShortcut(action)) {
        e.preventDefault();
        if (!['undo', 'redo', 'escape', 'nextTarget', 'previousTarget'].includes(action))
          playSfx('tap');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
