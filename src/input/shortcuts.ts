// Desktop keyboard shortcuts (DESIGN.md → "Desktop keyboard shortcuts").
import { useEffect } from 'react';
import { playSfx } from '../audio/audio';
import { useUi } from '../state/ui';

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
  | 'help';

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
    case '?':
      return 'help';
    default:
      return null;
  }
}

/** Screens where play-time shortcuts (map, edit, time, camera) apply. */
const PLAY_SCREENS = new Set(['scene', 'map', 'hub']);
const NO_HOME = new Set(['splash', 'age', 'profile', 'gate']);

export function runShortcut(action: ShortcutAction): boolean {
  const ui = useUi.getState();
  const screen = ui.nav.screen;
  switch (action) {
    case 'help':
      ui.setShortcutsOpen(!ui.shortcutsOpen);
      return true;
    case 'escape':
      if (ui.shortcutsOpen) ui.setShortcutsOpen(false);
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
      ui.go('map');
      return true;
    case 'edit':
      if (screen !== 'scene') return false;
      ui.go('houseWizard');
      return true;
    case 'camera':
      if (screen !== 'scene') return false;
      ui.go('photo');
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
    case 'redo':
      // The undo stack arrives in M4; swallow the key so the browser does nothing odd.
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
        if (action !== 'undo' && action !== 'redo') playSfx('tap');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
