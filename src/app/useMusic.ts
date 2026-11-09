// Which background music plays: a cosy tune at home, a sunnier one on the town map,
// a lullaby at night; quiet on the piano and the camera screens.
import { useEffect } from 'react';
import type { Mood } from '../audio/compose';
import { music } from '../audio/music';
import { isNight } from '../sim/clock';
import { useUi } from '../state/ui';
import type { ScreenId } from './machine';
import { sim } from './simRunner';

const QUIET: ReadonlySet<ScreenId> = new Set<ScreenId>(['piano', 'photoFace']);

/** The mood for a screen at a game minute (pure; unit-tested). */
export function moodFor(screen: ScreenId, minute: number): Mood | null {
  if (QUIET.has(screen)) return null;
  if (isNight(minute)) return 'lullaby';
  return screen === 'map' ? 'sunny' : 'cosy';
}

export function useMusic(): void {
  useEffect(() => {
    const update = () => music.setMood(moodFor(useUi.getState().nav.screen, sim.world.minute));
    update();
    const unsubscribe = useUi.subscribe(update);
    // Day turns to night while playing.
    const timer = window.setInterval(update, 3000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);
}
