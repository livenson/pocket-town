// Runs the simulation at a fixed 10 ticks per second of game time, decoupled from
// drawing. The stage reads the world each frame and interpolates with `alpha`.
import { tuning } from '../content/tuning';
import { apply, type Command } from '../sim/commands';
import { step } from '../sim/step';
import type { World } from '../sim/types';
import { START_MINUTE } from '../sim/clock';
import { createWorld } from '../sim/world';
import { useSettings } from '../state/settings';
import { useUi, type TimeSpeed } from '../state/ui';

const TICK_MS = 1000 / tuning.ticksPerSecond;
const MAX_TICKS_PER_FRAME = 40;
const SPEED: Record<TimeSpeed, number> = { pause: 0, play: 1, fast: tuning.fastForward };

type Listener = (world: World) => void;

/** `?seed=N` gives a reproducible world (tests, screenshots); otherwise a fresh one. */
function initialSeed(): number {
  const param =
    typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('seed');
  const n = param === null ? Number.NaN : Number(param);
  return Number.isFinite(n) ? n | 0 : (Date.now() % 2147483647) | 0;
}

/** `?hour=N` starts the world at that hour of the day (visual checks of night, dusk). */
function initialWorld(): World {
  const world = createWorld(initialSeed());
  const hour =
    typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('hour');
  if (hour !== null && Number.isFinite(Number(hour))) {
    world.minute = (((Number(hour) * 60 - START_MINUTE) % 1440) + 1440) % 1440;
  }
  return world;
}

class SimRunner {
  world: World = initialWorld();
  /** 0–1: how far between the last tick and the next (for smooth drawing). */
  alpha = 0;
  private acc = 0;
  private last = 0;
  private frame: number | null = null;
  private readonly listeners = new Set<Listener>();

  start(): void {
    if (this.frame !== null || typeof requestAnimationFrame === 'undefined') return;
    this.last = performance.now();
    const loop = (now: number) => {
      this.frame = requestAnimationFrame(loop);
      this.advance(now);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private advance(now: number): void {
    const dt = Math.min(250, now - this.last);
    this.last = now;
    this.world.energy = useSettings.getState().botEnergy;
    this.acc += dt * SPEED[useUi.getState().time];
    let ticks = 0;
    while (this.acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) {
      step(this.world);
      this.acc -= TICK_MS;
      ticks++;
    }
    if (ticks === MAX_TICKS_PER_FRAME) this.acc = 0;
    this.alpha = this.acc / TICK_MS;
    if (ticks > 0) for (const l of this.listeners) l(this.world);
  }

  /** Apply a child command now (works while paused too). */
  dispatch(cmd: Command): boolean {
    const ok = apply(this.world, cmd);
    if (ok) for (const l of this.listeners) l(this.world);
    return ok;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Replace the world (loading a save). */
  load(world: World): void {
    this.world = world;
    this.acc = 0;
    for (const l of this.listeners) l(this.world);
  }
}

export const sim = new SimRunner();
