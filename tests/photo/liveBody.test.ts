import { describe, expect, it } from 'vitest';
import type { Appearance } from '../../src/content/appearance';
import { BodyReader, bodyTarget, type BodyPoint } from '../../src/photo/liveBody';
import { boneMatrices, buildRig, REST, type Angles } from '../../src/stage/peg/rig';

const base: Appearance = { skin: '#E9B48A', outfit: '#EF4B2F', hair: '#2A1640', hairStyle: 'bob' };
const rig = buildRig(150, base);
/** 4:3 picture; points are written in a square space and divided back. */
const ASPECT = 4 / 3;

type Pt = [number, number];
/**
 * A child facing the camera, as the camera sees it (not mirrored): their left
 * side is on the picture's right. Points are given in square units (x across
 * 0…ASPECT) and converted to MediaPipe's 0–1 coordinates.
 */
function body(over: Partial<Record<number, Pt | null>> = {}, hipsSeen = false): BodyPoint[] {
  const pts: BodyPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
  const cx = ASPECT / 2;
  const set: Record<number, Pt | null> = {
    0: [cx, 0.35], // nose
    11: [cx + 0.15, 0.6], // left shoulder (picture's right)
    12: [cx - 0.15, 0.6],
    13: [cx + 0.17, 0.78], // elbows: arms hang down
    14: [cx - 0.17, 0.78],
    15: [cx + 0.18, 0.93], // wrists
    16: [cx - 0.18, 0.93],
    17: [cx + 0.19, 0.98], // pinkies and index fingers
    18: [cx - 0.19, 0.98],
    19: [cx + 0.17, 0.98],
    20: [cx - 0.17, 0.98],
    23: hipsSeen ? [cx + 0.09, 1.0] : null,
    24: hipsSeen ? [cx - 0.09, 1.0] : null,
    ...over,
  };
  for (const [k, v] of Object.entries(set)) {
    if (v) pts[Number(k)] = { x: v[0] / ASPECT, y: v[1], visibility: 0.95 };
  }
  return pts;
}

/** The pose after the reader has settled on the same picture. */
function settle(points: BodyPoint[] | null): Angles {
  const r = new BodyReader();
  let a: Angles = {};
  for (let i = 0; i < 40; i++) a = r.read(points, ASPECT);
  return a;
}

/** Where the figure's hands and shoulders end up for a pose (y up is negative). */
function joints(a: Angles) {
  const m = boneMatrices(rig, a);
  return {
    handL: { x: m.wristL.tx, y: m.wristL.ty },
    handR: { x: m.wristR.tx, y: m.wristR.ty },
    elbowL: { x: m.elbowL.tx, y: m.elbowL.ty },
    shoulderL: { x: m.shoulderL.tx, y: m.shoulderL.ty },
    shoulderR: { x: m.shoulderR.tx, y: m.shoulderR.ty },
  };
}

const cx = ASPECT / 2;
/** How far the upper body leans, all told (clockwise). */
const lean = (a: Angles) => (a.root ?? 0) + (a.pelvis ?? 0) + (a.torso ?? 0);

describe('live body (camera mirror)', () => {
  it('arms down stand at rest', () => {
    const a = settle(body());
    for (const k of ['shoulderL', 'shoulderR', 'elbowL', 'elbowR'] as const)
      expect(Math.abs((a[k] ?? 0) - (REST[k] ?? 0))).toBeLessThan(0.2);
    expect(Math.abs(lean(a))).toBeLessThan(0.02);
    const j = joints(a);
    expect(j.handL.y).toBeGreaterThan(j.shoulderL.y);
    expect(j.handR.y).toBeGreaterThan(j.shoulderR.y);
  });

  it('a raised arm lifts the hand above the shoulder, on the mirrored side', () => {
    // The child's own left arm straight up: in the mirror it is on the screen's left.
    const a = settle(body({ 13: [cx + 0.16, 0.42], 15: [cx + 0.16, 0.27], 17: null, 19: null }));
    const j = joints(a);
    expect(j.handL.y).toBeLessThan(j.shoulderL.y - 20);
    expect(j.handL.x).toBeLessThan(0);
    // The other arm still hangs.
    expect(j.handR.y).toBeGreaterThan(j.shoulderR.y);
    // Straight up shows as up and out, so the big head does not hide the arm.
    expect(a.shoulderL).toBeGreaterThan(2.4);
    expect(a.shoulderL).toBeLessThan(2.8);
    expect(j.handL.x).toBeLessThan(j.shoulderL.x - 10);
  });

  it('the right arm mirrors the left', () => {
    const a = settle(body({ 14: [cx - 0.16, 0.42], 16: [cx - 0.16, 0.27], 18: null, 20: null }));
    expect(a.shoulderR).toBeLessThan(-2.4);
    const j = joints(a);
    expect(j.handR.y).toBeLessThan(j.shoulderR.y - 20);
    expect(j.handR.x).toBeGreaterThan(0);
  });

  it('arms out to the sides point sideways', () => {
    const a = settle(
      body({
        13: [cx + 0.33, 0.6],
        15: [cx + 0.5, 0.6],
        14: [cx - 0.33, 0.6],
        16: [cx - 0.5, 0.6],
        17: null,
        18: null,
      }),
    );
    expect(a.shoulderL).toBeCloseTo(Math.PI / 2, 1);
    expect(a.shoulderR).toBeCloseTo(-Math.PI / 2, 1);
    const j = joints(a);
    expect(j.handL.x).toBeLessThan(j.shoulderL.x - 20);
    expect(j.handR.x).toBeGreaterThan(j.shoulderR.x + 20);
  });

  it('a wave bends the elbow: upper arm out, forearm up', () => {
    const a = settle(body({ 13: [cx + 0.33, 0.62], 15: [cx + 0.35, 0.45], 17: null, 19: null }));
    expect(Math.abs(a.elbowL ?? 0)).toBeGreaterThan(1.2);
    const j = joints(a);
    expect(j.handL.y).toBeLessThan(j.elbowL.y - 5);
  });

  it('arms the camera cannot see ease back to rest', () => {
    const up = body({ 13: [cx + 0.16, 0.42], 15: [cx + 0.16, 0.27] });
    const r = new BodyReader();
    for (let i = 0; i < 30; i++) r.read(up, ASPECT);
    const hidden = up.map((p, i) => (i === 13 || i === 15 ? { ...p, visibility: 0.1 } : p));
    let a: Angles = {};
    for (let i = 0; i < 40; i++) a = r.read(hidden, ASPECT);
    expect(a.shoulderL).toBeCloseTo(REST.shoulderL ?? 0, 2);
    expect(a.elbowL).toBeCloseTo(REST.elbowL ?? 0, 2);
  });

  it('a lost elbow keeps the shoulder but rests the forearm', () => {
    const t = bodyTarget(body({ 15: null }), ASPECT);
    expect(t.shoulderL).toBeDefined();
    expect(t.elbowL).toBeUndefined();
    expect(t.wristL).toBeUndefined();
  });

  it('no body at all stands at rest, legs untouched', () => {
    const a = settle(null);
    for (const k of ['shoulderL', 'shoulderR', 'elbowL', 'elbowR'] as const)
      expect(a[k]).toBeCloseTo(REST[k] ?? 0, 5);
    for (const k of ['hipL', 'hipR', 'kneeL', 'kneeR'] as const) expect(a[k] ?? 0).toBe(0);
  });

  it('leaning tilts the upper body the same way as the mirror, head kept upright', () => {
    // The child's left shoulder (screen left in the mirror) drops.
    const a = settle(body({ 11: [cx + 0.15, 0.66], 12: [cx - 0.15, 0.54] }));
    expect(lean(a)).toBeLessThan(-0.1);
    expect(a.head).toBeCloseTo(-lean(a), 5);
    // Most of it from the feet, a little at the waist; legs stay straight.
    expect(Math.abs(a.root ?? 0)).toBeGreaterThan(Math.abs(a.torso ?? 0));
    expect(a.hipL ?? 0).toBe(0);
    // With hips in view, leaning to the screen's right from the hips.
    const b = settle(body({ 11: [cx + 0.05, 0.6], 12: [cx - 0.25, 0.6] }, true));
    expect(lean(b)).toBeGreaterThan(0.1);
  });

  it('a level body does not lean', () => {
    // Shoulders are rarely exactly level: a small slope is ignored.
    const t = bodyTarget(body({ 11: [cx + 0.15, 0.605], 12: [cx - 0.15, 0.595] }), ASPECT);
    expect(t.lean).toBe(0);
  });

  it('keeps every angle in a sensible range', () => {
    // A wild reading: wrist far across the body and above the head.
    const t = bodyTarget(body({ 13: [cx - 0.4, 0.2], 15: [cx + 0.6, 0.0] }), ASPECT);
    expect(Math.abs(t.lean ?? 0)).toBeLessThanOrEqual(0.25);
    expect(t.shoulderL).toBeGreaterThanOrEqual(-1.4);
    expect(t.shoulderL).toBeLessThanOrEqual(3.3);
    expect(Math.abs(t.elbowL ?? 0)).toBeLessThanOrEqual(2.6);
    expect(Math.abs(t.wristL ?? 0)).toBeLessThanOrEqual(0.7);
  });
});
