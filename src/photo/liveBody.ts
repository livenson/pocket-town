// The live mirror's body: turns MediaPipe Pose Landmarker points (arms, shoulders,
// hips) into joint angles for the jointed figure (stage/peg/rig.ts), so waving,
// raising arms and leaning move the preview character like a mirror. Limbs the
// camera cannot see well drift back to standing at rest; legs always stay at rest
// (a tablet camera rarely sees them). Pure, so it is unit-tested.
import { REST, type Angles } from '../stage/peg/rig';

/** One body point: 0–1 across and down the camera picture (not mirrored). */
export interface BodyPoint {
  x: number;
  y: number;
  /** 0–1: how sure the finder is that this point is in the picture. */
  visibility?: number;
}

/** Points below this visibility are treated as not seen. */
export const SEEN = 0.5;
/** How much each reading moves the shown pose (0–1): smooth but quick. */
const FOLLOW = 0.5;
/** Leaning is small in real life: show a little more of it, up to a point. */
const LEAN_GAIN = 1.2;
const LEAN_MAX = 0.25;
/** Below this the body counts as upright (shoulders are rarely exactly level). */
const LEAN_DEAD = 0.04;
/**
 * The figure's head is big and its arms short: an arm raised straight up would
 * hide behind the head. Above shoulder height, arms rise this share of the way,
 * so straight up shows as up and out (like the cheer pose, rig.ts).
 */
const RAISE = 0.65;

// Pose Landmarker's points. "Left" is the child's own left, which a mirror shows
// on the screen's left: the figure's L side (rig.ts).
const IDX = {
  L: { shoulder: 11, elbow: 13, wrist: 15, pinky: 17, index: 19, hip: 23 },
  R: { shoulder: 12, elbow: 14, wrist: 16, pinky: 18, index: 20, hip: 24 },
} as const;

/**
 * What the camera drives: the lean of the upper body (radians, clockwise) and the
 * arm joints; everything else stays as it is at rest.
 */
const KEYS = ['lean', 'shoulderL', 'elbowL', 'wristL', 'shoulderR', 'elbowR', 'wristR'] as const;
type Key = (typeof KEYS)[number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** An angle brought into [lo, lo + 2π). */
const unwrap = (a: number, lo: number) => {
  const t = (a - lo) % (2 * Math.PI);
  return lo + (t < 0 ? t + 2 * Math.PI : t);
};
/** An angle brought into [-π, π). */
const wrap = (a: number) => unwrap(a, -Math.PI);

interface V {
  x: number;
  y: number;
}

/**
 * The rig angle that points a limb (which hangs along +y at angle 0) along v, in
 * screen space: positive is clockwise, so the limb's direction is (-sin a, cos a).
 */
const limbAngle = (v: V) => Math.atan2(-v.x, v.y);

const rest = (k: Key) => (k === 'lean' ? 0 : (REST[k] ?? 0));
/**
 * Most of a lean tilts the whole figure from the feet, the rest bends it at the
 * waist: bending only at the waist swings a dress or a long shirt's hem out.
 */
const LEAN_AT_FEET = 0.6;

/**
 * The pose the camera asks for, before smoothing. Missing angles mean "not seen":
 * the reader eases those back to rest. `aspect` is the picture's width / height,
 * so angles are measured in a square space.
 */
export function bodyTarget(
  points: readonly BodyPoint[] | null,
  aspect = 4 / 3,
): Partial<Record<Key, number>> {
  if (!points) return {};
  /** A seen point, mirrored like the camera view; null when not seen. */
  const at = (i: number): V | null => {
    const p = points[i];
    if (!p || (p.visibility ?? 1) < SEEN) return null;
    return { x: (1 - p.x) * aspect, y: p.y };
  };
  const out: Partial<Record<Key, number>> = {};
  const sL = at(IDX.L.shoulder);
  const sR = at(IDX.R.shoulder);
  // The upper body leans from the hips when they are seen, else from the slope
  // of the shoulders (a tablet usually sees only head and shoulders).
  let lean = 0;
  if (sL && sR) {
    const hL = at(IDX.L.hip);
    const hR = at(IDX.R.hip);
    if (hL && hR) {
      const dx = (sL.x + sR.x - hL.x - hR.x) / 2;
      const dy = (sL.y + sR.y - hL.y - hR.y) / 2;
      lean = Math.atan2(dx, -dy);
    } else lean = Math.atan2(sR.y - sL.y, sR.x - sL.x);
    lean = Math.abs(lean) < LEAN_DEAD ? 0 : clamp(lean * LEAN_GAIN, -LEAN_MAX, LEAN_MAX);
    out.lean = lean;
  }
  for (const side of ['L', 'R'] as const) {
    const ix = IDX[side];
    const shoulder = at(ix.shoulder);
    const elbow = at(ix.elbow);
    if (!shoulder || !elbow) continue;
    const upper = limbAngle({ x: elbow.x - shoulder.x, y: elbow.y - shoulder.y });
    // Each arm turns freely up and out on its own side; the range breaks where
    // it points straight across the body (a pose a real arm hardly makes).
    const half = Math.PI / 2;
    if (side === 'L') {
      const a = unwrap(upper - lean, -half);
      out.shoulderL = clamp(a > half ? half + (a - half) * RAISE : a, -1.4, 3.3);
    } else {
      const a = unwrap(upper - lean, -3 * half);
      out.shoulderR = clamp(a < -half ? -half + (a + half) * RAISE : a, -3.3, 1.4);
    }
    const wrist = at(ix.wrist);
    if (!wrist) continue;
    const fore = limbAngle({ x: wrist.x - elbow.x, y: wrist.y - elbow.y });
    out[`elbow${side}`] = clamp(wrap(fore - upper), -2.6, 2.6);
    const index = at(ix.index);
    const pinky = at(ix.pinky);
    if (!index || !pinky) continue;
    const hand = limbAngle({
      x: (index.x + pinky.x) / 2 - wrist.x,
      y: (index.y + pinky.y) / 2 - wrist.y,
    });
    out[`wrist${side}`] = clamp(wrap(hand - fore), -0.7, 0.7);
  }
  return out;
}

/** Follows the camera's body readings smoothly, frame by frame. */
export class BodyReader {
  private shown: Record<Key, number> = BodyReader.restPose();

  private static restPose(): Record<Key, number> {
    return {
      lean: 0,
      shoulderL: rest('shoulderL'),
      elbowL: rest('elbowL'),
      wristL: rest('wristL'),
      shoulderR: rest('shoulderR'),
      elbowR: rest('elbowR'),
      wristR: rest('wristR'),
    };
  }

  reset(): void {
    this.shown = BodyReader.restPose();
  }

  /** Feed one reading (null: no body seen); returns the joint angles to show. */
  read(points: readonly BodyPoint[] | null, aspect = 4 / 3): Angles {
    const target = bodyTarget(points, aspect);
    for (const k of KEYS) {
      const t = target[k] ?? rest(k);
      this.shown[k] += (t - this.shown[k]) * FOLLOW;
    }
    const { lean, ...arms } = this.shown;
    return {
      ...REST,
      ...arms,
      root: lean * LEAN_AT_FEET,
      torso: lean * (1 - LEAN_AT_FEET),
      // Shoes stay flat on the floor.
      ankleL: -lean * LEAN_AT_FEET,
      ankleR: -lean * LEAN_AT_FEET,
      // The face reading already tilts the head as the child's does in the
      // picture: undo the lean at the neck so the tilt is not counted twice.
      head: -lean,
    };
  }
}
