// Layout mode and motion preferences from media queries.
import { useSyncExternalStore } from 'react';
import { breakpoints } from '../design/tokens';
import { useSettings } from '../state/settings';

export type LayoutMode = 'phone' | 'tablet' | 'desktop';

const PHONE = `(max-width: ${breakpoints.phoneMaxWidth - 0.02}px) and (orientation: portrait)`;
const DESKTOP = `(min-width: ${breakpoints.desktopMinWidth}px) and (pointer: fine)`;
const REDUCED = '(prefers-reduced-motion: reduce)';

function subscribeQueries(queries: string[]) {
  return (onChange: () => void) => {
    if (typeof matchMedia === 'undefined') return () => undefined;
    const lists = queries.map((q) => matchMedia(q));
    for (const l of lists) l.addEventListener('change', onChange);
    return () => {
      for (const l of lists) l.removeEventListener('change', onChange);
    };
  };
}

const matches = (q: string): boolean => typeof matchMedia !== 'undefined' && matchMedia(q).matches;

const subscribeLayout = subscribeQueries([PHONE, DESKTOP]);
const subscribeReduced = subscribeQueries([REDUCED]);

export function currentLayout(): LayoutMode {
  if (matches(PHONE)) return 'phone';
  if (matches(DESKTOP)) return 'desktop';
  return 'tablet';
}

/** phone = portrait under 600 px; desktop = 1024 px and up with a fine pointer; else tablet. */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribeLayout, currentLayout, () => 'tablet');
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => matches(REDUCED),
    () => false,
  );
}

/** Calm motion: the in-game setting or the system "reduce motion" preference. */
export function useCalmMotion(): boolean {
  const setting = useSettings((s) => s.calmMotion);
  const reduced = usePrefersReducedMotion();
  return setting || reduced;
}

/** Calm motion outside React (for the Pixi stage and audio). */
export function isCalmMotion(): boolean {
  return useSettings.getState().calmMotion || matches(REDUCED);
}
