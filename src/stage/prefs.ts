// Preferences the stage needs every frame, kept current without per-frame lookups.
import { useSettings } from '../state/settings';
import { useUi, type TimeSpeed } from '../state/ui';

const SPEED: Record<TimeSpeed, number> = { pause: 0, play: 1, fast: 4 };

export class StagePrefs {
  calm = false;
  speed = 1;
  private reduced = false;
  private readonly unsubscribers: (() => void)[] = [];

  constructor() {
    const mq =
      typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = mq?.matches ?? false;
    const onMq = (e: MediaQueryListEvent) => {
      this.reduced = e.matches;
      this.refresh();
    };
    mq?.addEventListener('change', onMq);
    this.unsubscribers.push(() => mq?.removeEventListener('change', onMq));
    this.unsubscribers.push(useSettings.subscribe(() => this.refresh()));
    this.unsubscribers.push(useUi.subscribe(() => this.refresh()));
    this.refresh();
  }

  private refresh(): void {
    this.calm = useSettings.getState().calmMotion || this.reduced;
    this.speed = SPEED[useUi.getState().time];
  }

  dispose(): void {
    for (const u of this.unsubscribers) u();
  }
}
