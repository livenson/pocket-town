// A peg-folk character on the stage: the drawn figure, its motion, and its intent bubble.
import { Container, Graphics } from 'pixi.js';
import type { IconName } from '../../design/icons';
import { IntentBubble } from '../IntentBubble';
import {
  combine,
  dancePose,
  idlePose,
  jumpPose,
  restPose,
  sleepPose,
  Tweens,
  walkPose,
  type Pose,
} from '../motion';
import { drawHead, drawPrims } from './drawPeg';
import type { Appearance, Eyes } from './geometry';
import {
  boneMatrices,
  buildRig,
  headCentre,
  LIE_ANGLE,
  partMatrix,
  poseAngles,
  poseScales,
  type BoneId,
  type Gesture,
  type Rig,
  type Stance,
} from './rig';

/**
 * How the character holds itself: standing, or sitting or lying on furniture at a
 * room point (see activityPose.ts), and the arms' gesture.
 */
export interface PegLook {
  stance: Stance;
  gesture: Gesture;
  /** Sitting: where the hips go. Lying: where the head rests. Room units. */
  at?: { x: number; y: number };
  /** Lying: which way the head points. */
  facing?: 1 | -1;
  /** Depth to draw at (in front of the piece sat or lain on). */
  z?: number;
}

const STANDING: PegLook = { stance: 'stand', gesture: 'none' };
const FRONT_ARM: ReadonlySet<BoneId> = new Set(['shoulderR', 'elbowR', 'wristR']);

export type PegActivity = 'idle' | 'walk' | 'sleep' | 'dance';

/** Walking speed in stage units per second. */
const WALK_SPEED = 90;
/** Hops per stage unit walked. */
const HOPS_PER_UNIT = 1 / 42;
/** Texture resolution for cached heads (room scale up to ~1.6 × device pixel ratio 2). */
const CACHE_RESOLUTION = 3;
/** Walking hops are lower now that the legs stride. */
const HOP_SCALE = 0.5;

export class PegView extends Container {
  readonly figure = new Container();
  readonly bubble = new IntentBubble();
  private readonly rig: Rig;
  /** One shape per part, back to front, each following its bone. */
  private readonly parts: { bone: BoneId; g: Graphics; only?: Gesture | 'lie' }[] = [];
  private look: PegLook = STANDING;
  /** Lying: the feet's offset from the head (rest pose). */
  private readonly headFromFeet: { x: number; y: number };
  private head: Graphics;
  private eyes: Eyes = 'open';
  private activity: PegActivity = 'idle';
  private targetX: number | null = null;
  private stepPhase = 0;
  private jumpT = 0;
  private facing: 1 | -1 = 1;
  /** Set by `follow` when the simulation says the character is walking. */
  private walkingNow = false;
  private readonly tweens = new Tweens();
  /** Offsets idle animations so characters do not breathe in unison. */
  private readonly phase: number;
  private readonly size: number;
  readonly id: string;
  private readonly appearance: Appearance;

  constructor(id: string, appearance: Appearance, size: number, phase = 0) {
    super();
    this.id = id;
    this.appearance = appearance;
    this.size = size;
    this.phase = phase;
    this.rig = buildRig(size, appearance);
    this.head = this.drawHeadArt();
    for (const part of this.rig.parts) {
      let g: Graphics;
      if ('head' in part) g = this.head;
      else {
        g = new Graphics();
        drawPrims(g, part.prims);
      }
      this.parts.push({ bone: part.bone, g, only: 'only' in part ? part.only : undefined });
      this.figure.addChild(g);
    }
    this.headFromFeet = headCentre(this.rig, appearance);
    this.pose(0, 0, false);
    this.bubble.position.set(0, -size - 34);
    this.addChild(this.figure, this.bubble);
    this.label = `peg:${id}`;
  }

  private drawHeadArt(): Graphics {
    const g = drawHead(this.size, this.appearance, this.eyes);
    g.pivot.set(this.rig.headPivot.x, this.rig.headPivot.y);
    // One texture per appearance and eye state: cheap to draw many characters.
    // High resolution so it stays crisp when the room is scaled up on big screens.
    g.cacheAsTexture({ resolution: CACHE_RESOLUTION, antialias: true });
    return g;
  }

  private redraw(): void {
    const next = this.drawHeadArt();
    const at = this.figure.getChildIndex(this.head);
    next.position.copyFrom(this.head.position);
    next.rotation = this.head.rotation;
    this.figure.removeChild(this.head);
    this.head.destroy();
    this.head = next;
    this.figure.addChildAt(next, at);
    for (const p of this.parts) if (p.bone === 'head') p.g = next;
  }

  /** Put every part where its bone is, for what the character is doing now. */
  private pose(timeS: number, cheer: number, calm: boolean): void {
    const walking = this.walkingNow || this.targetX !== null;
    const { stance, gesture } = this.look;
    const input = {
      activity: this.activity,
      timeS,
      phase: this.phase,
      stepPhase: this.stepPhase,
      walking,
      calm,
      cheer,
      stance,
      gesture,
      lieAngle: LIE_ANGLE,
    };
    const scales = poseScales(input);
    const mats = boneMatrices(this.rig, poseAngles(input), scales);
    for (const p of this.parts) {
      const m = partMatrix(mats, p.bone, scales);
      p.g.position.set(m.tx, m.ty);
      const rot = Math.atan2(m.b, m.a);
      p.g.rotation = rot;
      // A shortened bone: only ever along its own length.
      p.g.scale.set(1, Math.hypot(m.c, m.d));
      const lying = stance === 'lie' && !walking;
      // Lying, the front arm stays under the blanket.
      const tucked = lying && FRONT_ARM.has(p.bone);
      p.g.visible =
        !tucked &&
        (p.only === undefined || (p.only === 'lie' ? lying : !walking && p.only === gesture));
    }
  }

  /** Stand, sit or lie, and what the arms do (see activityPose.ts). */
  setLook(look: PegLook | null): void {
    this.look = look ?? STANDING;
  }

  setEyes(eyes: Eyes): void {
    if (eyes === this.eyes) return;
    this.eyes = eyes;
    this.redraw();
  }

  setActivity(activity: PegActivity): void {
    this.activity = activity;
    this.setEyes(activity === 'sleep' ? 'sleep' : 'open');
  }

  /** Walk to an x position on the floor line; the walk ends in `idle`. */
  walkTo(x: number): void {
    this.targetX = x;
    this.activity = 'walk';
  }

  get walking(): boolean {
    return this.targetX !== null;
  }

  face(direction: 1 | -1): void {
    this.facing = direction;
  }

  /** A one-off happy jump. */
  jump(): void {
    this.jumpT = 0.0001;
  }

  showIntent(icon: IconName, color: string, progress: number | null = null): void {
    this.bubble.show(icon, color, progress);
  }

  /**
   * Follow the simulation: position (already interpolated), facing, whether it is
   * walking this frame, and the pose of what it is doing.
   */
  follow(
    x: number,
    y: number,
    facing: 1 | -1,
    walking: boolean,
    activity: PegActivity,
    dtS: number,
    timeS: number,
    calm: boolean,
  ): void {
    const moved = Math.abs(x - this.x);
    this.position.set(x, y);
    this.facing = facing;
    this.targetX = null;
    this.walkingNow = walking;
    if (walking) this.stepPhase += moved * HOPS_PER_UNIT;
    else this.stepPhase = 0;
    if (activity !== this.activity) this.setActivity(activity);
    this.update(dtS, timeS, calm);
  }

  /** Advance motion. `dtS` is seconds of stage time; `timeS` the stage clock. */
  update(dtS: number, timeS: number, calm: boolean): void {
    this.tweens.update(dtS * 1000);
    let pose: Pose = restPose;

    if (this.targetX !== null) {
      const dx = this.targetX - this.x;
      const step = WALK_SPEED * dtS;
      if (Math.abs(dx) <= step) {
        this.x = this.targetX;
        this.targetX = null;
        this.activity = 'idle';
        this.stepPhase = 0;
      } else {
        const dir = dx > 0 ? 1 : -1;
        this.facing = dir;
        this.x += dir * step;
        this.stepPhase += step * HOPS_PER_UNIT;
        pose = lowHop(walkPose(this.stepPhase, calm));
      }
    }
    if (this.targetX === null && this.walkingNow) {
      pose = lowHop(walkPose(this.stepPhase, calm));
    } else if (this.targetX === null) {
      if (this.activity === 'sleep') pose = sleepPose(timeS, this.phase, calm);
      else if (this.activity === 'dance') pose = dancePose(timeS, this.phase, calm);
      else pose = idlePose(timeS, this.phase, calm);
    }

    if (this.jumpT > 0) {
      this.jumpT += dtS / 0.6;
      if (this.jumpT >= 1) this.jumpT = 0;
      pose = combine(pose, jumpPose(this.jumpT, calm));
    }

    this.pose(timeS, this.jumpT, calm);
    const { stance, at } = this.look;
    const placed = at && stance !== 'stand' && !this.walkingNow && this.targetX === null;
    if (placed && stance === 'sit') {
      // The hips on the seat; only a gentle breath.
      const pelvisY = this.rig.bones.pelvis.y;
      this.figure.position.set(at.x - this.x, at.y - this.y - pelvisY);
      this.figure.scale.set(this.facing, 1 + (pose.scaleY - 1) * 0.5);
      this.figure.rotation = 0;
    } else if (placed && stance === 'lie') {
      // The head on the pillow: the feet go where the turned body puts them.
      const dir = this.look.facing ?? 1;
      const h = this.headFromFeet;
      const c = Math.cos(LIE_ANGLE);
      const sn = Math.sin(LIE_ANGLE);
      const hx = (c * h.x - sn * h.y) * dir;
      const hy = sn * h.x + c * h.y;
      this.figure.position.set(at.x - hx - this.x, at.y - hy - this.y);
      this.figure.scale.set(dir, 1);
      this.figure.rotation = 0;
    } else {
      this.figure.position.set(0, pose.dy);
      this.figure.scale.set(pose.scaleX * this.facing, pose.scaleY);
      this.figure.rotation = pose.rotation;
    }
    // Bubbles ride along with hops but never flip or squash. They may live in a
    // separate layer (above the night dimming), so position them in room units.
    if (this.bubble.parent === this) this.bubble.position.set(0, -this.size - 34 + pose.dy);
    else this.bubble.position.set(this.x, this.y - this.size - 34 + pose.dy);
    // Depth sorting: things lower on the floor are drawn in front; sitting or
    // lying, in front of the piece.
    this.zIndex = placed && this.look.z !== undefined ? this.look.z : this.y;
  }
}

/** The legs stride now, so a walk needs only a small hop. */
function lowHop(p: Pose): Pose {
  return { ...p, dy: p.dy * HOP_SCALE, rotation: p.rotation * HOP_SCALE };
}
