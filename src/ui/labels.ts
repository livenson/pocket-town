import { useProfiles } from '../state/profiles';
import { useSettings } from '../state/settings';

/** Optional text labels: on when the setting is on, or the player is 9 or older. */
export function useShowTextLabels(): boolean {
  const setting = useSettings((s) => s.textLabels);
  const age = useProfiles((s) => s.active?.age ?? null);
  return setting || (age !== null && age >= 9);
}
