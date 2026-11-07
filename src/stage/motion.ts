// Motion maths for characters: easing, a small tween runner, and the poses for
// idle breathing, walk hops (squash and stretch), happy jumps and sleep sway.
// Pure functions of time so they are easy to test and to freeze for screenshots.

export type Easing = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - (1 - t) ** 3,
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
} satisfies Record<string, Easing>;

export interface Pose {
  /** Vertical offset in stage units (negative = up). */
  dy: number;
  scaleX: number;
  scaleY: number;
  /** Rotation in radians. */
  rotation: number;
}

export const restPose: Pose = { dy: 0, scaleX: 1, scaleY: 1, rotation: 0 };

/** Idle breathing: a gentle bob of ~2.5 units every 2 s. `phase` offsets characters. */
export function idlePose(timeS: number, phase: number, calm: boolean): Pose {
  const s = Math.sin(((timeS + phase) / 2) * Math.PI * 2);
  const amp = calm ? 1 : 2.5;
  return {
    dy: -Math.max(0, s) * amp,
    scaleX: 1,
    scaleY: 1 + s * (calm ? 0.004 : 0.012),
    rotation: 0,
  };
}

/**
 * Walking. `stepPhase` grows by one per hop. Each hop lifts the character and it
 * squashes as it lands. Calm motion glides without hops.
 */
export function walkPose(stepPhase: number, calm: boolean): Pose {
  if (calm) {
    const s = Math.sin(stepPhase * Math.PI * 2);
    return { dy: -Math.abs(s) * 0.8, scaleX: 1, scaleY: 1, rotation: s * 0.01 };
  }
  const p = stepPhase - Math.floor(stepPhase);
  const lift = Math.sin(p * Math.PI); // 0 → 1 → 0 over one hop
  // Squash in the first and last 15% of the hop (on the ground), stretch in the air.
  const ground = p < 0.15 ? 1 - p / 0.15 : p > 0.85 ? (p - 0.85) / 0.15 : 0;
  const squash = ground * 0.08;
  const stretch = lift * 0.04;
  return {
    dy: -lift * 9,
    scaleX: 1 + squash - stretch * 0.5,
    scaleY: 1 - squash + stretch,
    rotation: Math.sin(p * Math.PI * 2) * 0.03,
  };
}

/** Happy jump over `t` in 0..1: crouch, leap, squash on landing. */
export function jumpPose(t: number, calm: boolean): Pose {
  if (t <= 0 || t >= 1) return restPose;
  if (calm) return { dy: -Math.sin(t * Math.PI) * 4, scaleX: 1, scaleY: 1, rotation: 0 };
  if (t < 0.15) {
    const k = t / 0.15;
    return { dy: 0, scaleX: 1 + k * 0.1, scaleY: 1 - k * 0.12, rotation: 0 };
  }
  if (t < 0.85) {
    const k = (t - 0.15) / 0.7;
    return { dy: -Math.sin(k * Math.PI) * 32, scaleX: 0.94, scaleY: 1.08, rotation: 0 };
  }
  const k = (t - 0.85) / 0.15;
  return { dy: 0, scaleX: 1 + (1 - k) * 0.1, scaleY: 1 - (1 - k) * 0.1, rotation: 0 };
}

/** Sleeping: a slow sway. */
export function sleepPose(timeS: number, phase: number, calm: boolean): Pose {
  const s = Math.sin(((timeS + phase) / 3) * Math.PI * 2);
  return { dy: 0, scaleX: 1, scaleY: 1 + s * 0.006, rotation: s * (calm ? 0.01 : 0.035) };
}

/** Dancing: sway side to side with little bounces. */
export function dancePose(timeS: number, phase: number, calm: boolean): Pose {
  const s = Math.sin((timeS + phase) * Math.PI * 2 * 0.8);
  if (calm) return { dy: 0, scaleX: 1, scaleY: 1, rotation: s * 0.04 };
  return { dy: -Math.abs(s) * 5, scaleX: 1, scaleY: 1 + Math.abs(s) * 0.02, rotation: s * 0.14 };
}

export function combine(a: Pose, b: Pose): Pose {
  return {
    dy: a.dy + b.dy,
    scaleX: a.scaleX * b.scaleX,
    scaleY: a.scaleY * b.scaleY,
    rotation: a.rotation + b.rotation,
  };
}

interface Tween {
  elapsed: number;
  duration: number;
  easing: Easing;
  onUpdate: (t: number) => void;
  onDone?: () => void;
}

/** A tiny tween runner driven by the Pixi ticker (milliseconds). */
export class Tweens {
  private items: Tween[] = [];

  add(
    duration: number,
    onUpdate: (t: number) => void,
    easing: Easing = ease.outCubic,
    onDone?: () => void,
  ): void {
    this.items.push({ elapsed: 0, duration, easing, onUpdate, onDone });
  }

  update(dtMs: number): void {
    for (const tw of this.items) {
      tw.elapsed = Math.min(tw.duration, tw.elapsed + dtMs);
      tw.onUpdate(tw.easing(tw.duration === 0 ? 1 : tw.elapsed / tw.duration));
    }
    const done = this.items.filter((t) => t.elapsed >= t.duration);
    this.items = this.items.filter((t) => t.elapsed < t.duration);
    for (const t of done) t.onDone?.();
  }

  get active(): number {
    return this.items.length;
  }
}
