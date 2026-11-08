import { describe, expect, it } from 'vitest';
import type { Appearance, Kind } from '../../src/content/appearance';
import { clothesKinds } from '../../src/content/looks';
import type { Prim } from '../../src/stage/peg/extras';
import { helmetPrims } from '../../src/stage/peg/outfit';
import {
  apply,
  boneMatrices,
  buildRig,
  headGeometry,
  poseAngles,
  REST,
  shoulderWidth,
  type Angles,
  type PoseInput,
  type Rig,
} from '../../src/stage/peg/rig';

const base: Appearance = { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' };
const S = 150;

/** Points a shape covers (for bounds), in its own space. */
function points(p: Prim): [number, number][] {
  const pad = 'sw' in p && p.sw ? p.sw / 2 : 0;
  if (p.t === 'rect')
    return [
      [p.x - pad, p.y - pad],
      [p.x + p.w + pad, p.y + p.h + pad],
    ];
  if (p.t === 'ellipse')
    return [
      [p.cx - p.rx - pad, p.cy - p.ry - pad],
      [p.cx + p.rx + pad, p.cy + p.ry + pad],
    ];
  if (p.t === 'line')
    return [
      [p.x1 - pad, p.y1 - pad],
      [p.x2 + pad, p.y2 + pad],
      [p.x1 + pad, p.y1 + pad],
      [p.x2 - pad, p.y2 - pad],
    ];
  const out: [number, number][] = [];
  for (let i = 0; i < p.pts.length; i += 2) out.push([p.pts[i] ?? 0, p.pts[i + 1] ?? 0]);
  return out;
}

/** Bounds of the body parts (not the head) in figure space. */
function bounds(rig: Rig, angles: Angles = REST) {
  const m = boneMatrices(rig, angles);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const part of rig.parts) {
    if ('head' in part) continue;
    for (const p of part.prims)
      for (const [x, y] of points(p)) {
        const w = apply(m[part.bone], x, y);
        x0 = Math.min(x0, w.x);
        y0 = Math.min(y0, w.y);
        x1 = Math.max(x1, w.x);
        y1 = Math.max(y1, w.y);
      }
  }
  return { x0, y0, x1, y1 };
}

const pose = (p: Partial<PoseInput>): Angles =>
  poseAngles({
    activity: 'idle',
    timeS: 0,
    phase: 0,
    stepPhase: 0,
    walking: false,
    calm: false,
    cheer: 0,
    ...p,
  });

/** The front forearm's shapes. */
const forearm = (a: Appearance) =>
  buildRig(S, a).parts.find((p) => p.bone === 'elbowR' && 'prims' in p);
const count = (a: Appearance) => {
  const p = forearm(a);
  return p && 'prims' in p ? p.prims.length : 0;
};

describe('the detailed figure', () => {
  it('everyone has two arms with hands, two legs with feet, a neck and a head (older saves too)', () => {
    const bones = buildRig(S, base).parts.map((p) => p.bone);
    for (const b of ['wristL', 'wristR', 'ankleL', 'ankleR', 'elbowL', 'kneeR', 'neck', 'head'])
      expect(bones).toContain(b);
  });

  it('stands on the ground: the feet reach y = 0', () => {
    for (const clothes of clothesKinds) {
      const b = bounds(buildRig(S, { ...base, clothes }));
      expect({ clothes, ground: Math.abs(b.y1) < 2 }).toEqual({ clothes, ground: true });
    }
  });

  it('draws every outfit differently, and only the space suit has a helmet', () => {
    const drawn = clothesKinds.map((clothes) =>
      JSON.stringify(buildRig(S, { ...base, clothes }).parts),
    );
    expect(new Set(drawn).size).toBe(clothesKinds.length);
    for (const clothes of clothesKinds) {
      const a = { ...base, clothes };
      expect({ clothes, helmet: helmetPrims(headGeometry(S, a), a).length > 0 }).toEqual({
        clothes,
        helmet: clothes === 'space',
      });
    }
  });

  it('animals have a tail and paws; people do not have a tail', () => {
    const kinds: Kind[] = ['cat', 'dog', 'bear', 'bunny', 'mouse'];
    for (const kind of kinds)
      expect(buildRig(S, { ...base, kind }).parts.some((p) => p.bone === 'tail')).toBe(true);
    expect(buildRig(S, base).parts.some((p) => p.bone === 'tail')).toBe(false);
  });

  it('a play tattoo on the arm shows on the front forearm, but not on a space suit', () => {
    const plain = { ...base, clothes: 'pants' as const };
    const inked = { ...plain, face: { tattoo: 'star' as const } };
    expect(count(inked)).toBeGreaterThan(count(plain) - 1);
    expect(JSON.stringify(forearm(inked))).not.toBe(JSON.stringify(forearm(plain)));
    const space = { ...inked, clothes: 'space' as const };
    expect(count(space)).toBe(count({ ...space, face: {} }));
  });

  it('boys have broader shoulders than girls', () => {
    expect(shoulderWidth(S, { ...base, figure: 'boy' })).toBeGreaterThan(
      shoulderWidth(S, { ...base, figure: 'girl' }),
    );
  });

  it('fits the portrait frame in every outfit and pose', () => {
    for (const clothes of clothesKinds)
      for (const angles of [REST, pose({ walking: true, stepPhase: 0.5 }), pose({ cheer: 0.5 })]) {
        const b = bounds(buildRig(S, { ...base, clothes }), angles);
        expect({ clothes, ok: b.x0 >= -0.3 * S && b.x1 <= 0.3 * S && b.y0 >= -1.08 * S }).toEqual({
          clothes,
          ok: true,
        });
      }
  });

  it('the head sits on the neck, with room above for a puff of hair', () => {
    const a: Appearance = { ...base, hairStyle: 'puff' };
    const rig = buildRig(S, a);
    const m = boneMatrices(rig, REST).head;
    const g = headGeometry(S, a);
    const top = apply(m, 0, (g.top?.y ?? 0) - rig.headPivot.y).y;
    const chin = apply(m, 0, g.head.y + g.headRy * 2 - rig.headPivot.y).y;
    expect(top).toBeGreaterThanOrEqual(-1.08 * S);
    expect(chin).toBeGreaterThan(boneMatrices(rig, REST).neck.ty - 0.04 * S);
  });
});

describe('poses', () => {
  it('walking swings the legs against each other, the arms against the legs', () => {
    const w = pose({ walking: true, stepPhase: 0.5 });
    expect(Math.sign(w.hipL ?? 0)).toBe(-Math.sign(w.hipR ?? 0));
    expect((w.shoulderL ?? 0) - 0.1).toBeLessThan(0);
  });

  it('calm motion moves less', () => {
    const big = pose({ walking: true, stepPhase: 0.5 });
    const calm = pose({ walking: true, stepPhase: 0.5, calm: true });
    expect(Math.abs(calm.hipL ?? 0)).toBeLessThan(Math.abs(big.hipL ?? 0));
  });

  it('dancing and cheering raise the hands above the shoulders', () => {
    const rig = buildRig(S, base);
    for (const angles of [pose({ activity: 'dance' }), pose({ cheer: 0.5 })]) {
      const m = boneMatrices(rig, angles);
      expect(m.wristL.ty).toBeLessThan(m.shoulderL.ty);
      expect(m.wristR.ty).toBeLessThan(m.shoulderR.ty);
    }
    const rest = boneMatrices(rig, REST);
    expect(rest.wristL.ty).toBeGreaterThan(rest.shoulderL.ty);
  });
});
