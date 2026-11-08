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
import { boneMatrices, buildRig, poseAngles, type BoneId, type Rig } from './rig';

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
  private readonly parts: { bone: BoneId; g: Graphics }[] = [];
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
      this.parts.push({ bone: part.bone, g });
      this.figure.addChild(g);
    }
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
    const mats = boneMatrices(
      this.rig,
      poseAngles({
        activity: this.activity,
        timeS,
        phase: this.phase,
        stepPhase: this.stepPhase,
        walking: this.walkingNow || this.targetX !== null,
        calm,
        cheer,
      }),
    );
    for (const p of this.parts) {
      const m = mats[p.bone];
      p.g.position.set(m.tx, m.ty);
      p.g.rotation = Math.atan2(m.b, m.a);
    }
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
    this.figure.position.y = pose.dy;
    this.figure.scale.set(pose.scaleX * this.facing, pose.scaleY);
    this.figure.rotation = pose.rotation;
    // Bubbles ride along with hops but never flip or squash. They may live in a
    // separate layer (above the night dimming), so position them in room units.
    if (this.bubble.parent === this) this.bubble.position.set(0, -this.size - 34 + pose.dy);
    else this.bubble.position.set(this.x, this.y - this.size - 34 + pose.dy);
    // Depth sorting: things lower on the floor are drawn in front.
    this.zIndex = this.y;
  }
}

/** The legs stride now, so a walk needs only a small hop. */
function lowHop(p: Pose): Pose {
  return { ...p, dy: p.dy * HOP_SCALE, rotation: p.rotation * HOP_SCALE };
}
