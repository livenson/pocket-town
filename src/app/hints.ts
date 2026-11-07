// First-play hints (M5): "+" → pick the cake → give it to a friend → the map glows.
// They run once per player and never come back after the map is tapped.
import { create } from 'zustand';
import { speak } from '../audio/speech';
import { strings } from '../i18n';
import { useProfiles } from '../state/profiles';

export type HintStep = 'plus' | 'cake' | 'give' | 'fed' | 'map';

interface HintStore {
  step: HintStep | null;
  start: (phone: boolean) => void;
  stop: () => void;
}

let fedTimer: ReturnType<typeof setTimeout> | null = null;

function show(step: HintStep | null): void {
  useHints.setState({ step });
  if (step) speak(strings.hints[step]);
}

export const useHints = create<HintStore>()(() => ({
  step: null,
  start: (phone) => {
    const { active, profiles } = useProfiles.getState();
    const profile = profiles.find((p) => p.id === active?.id);
    if (!profile || profile.hintsDone || useHints.getState().step) return;
    show(phone ? 'plus' : 'cake');
  },
  stop: () => {
    if (fedTimer) clearTimeout(fedTimer);
    useHints.setState({ step: null });
  },
}));

/** Called by the play controls as the child goes along. */
export const hint = {
  sheetOpened(): void {
    if (useHints.getState().step === 'plus') show('cake');
  },
  pickedUp(kind: string): void {
    const step = useHints.getState().step;
    if ((step === 'cake' || step === 'plus') && kind === 'cake') show('give');
  },
  dropped(): void {
    if (useHints.getState().step === 'give') show('cake');
  },
  gave(): void {
    if (useHints.getState().step !== 'give') return;
    show('fed');
    if (fedTimer) clearTimeout(fedTimer);
    fedTimer = setTimeout(() => {
      if (useHints.getState().step === 'fed') show('map');
    }, 1600);
  },
  /** The child closed the hints: they are done for this player, like finishing them. */
  dismiss(): void {
    const id = useProfiles.getState().active?.id;
    if (id) useProfiles.getState().update(id, { hintsDone: true });
    useHints.getState().stop();
  },
  mapOpened(): void {
    const step = useHints.getState().step;
    if (step === null) return;
    if (step === 'map' || step === 'fed') {
      const id = useProfiles.getState().active?.id;
      if (id) useProfiles.getState().update(id, { hintsDone: true });
    }
    useHints.getState().stop();
  },
};
