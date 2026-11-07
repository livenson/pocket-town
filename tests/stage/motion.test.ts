import { describe, expect, it } from 'vitest';
import { ease, idlePose, jumpPose, sleepPose, Tweens, walkPose } from '../../src/stage/motion';

describe('motion', () => {
  it('easings start at 0 and end at 1', () => {
    for (const f of Object.values(ease)) {
      expect(f(0)).toBeCloseTo(0);
      expect(f(1)).toBeCloseTo(1);
    }
  });

  it('idle breathing bobs by at most ~2.5 units, less under calm motion', () => {
    let max = 0;
    let maxCalm = 0;
    for (let t = 0; t < 2; t += 0.05) {
      max = Math.max(max, -idlePose(t, 0, false).dy);
      maxCalm = Math.max(maxCalm, -idlePose(t, 0, true).dy);
    }
    expect(max).toBeGreaterThan(2);
    expect(max).toBeLessThanOrEqual(2.5);
    expect(maxCalm).toBeLessThan(max);
  });

  it('walking hops and squashes on landing; calm motion removes hops; wheelchairs roll', () => {
    expect(-walkPose(0.5, false, false).dy).toBeGreaterThan(8); // mid-air
    const landing = walkPose(0.02, false, false);
    expect(landing.scaleY).toBeLessThan(1); // squash
    expect(landing.scaleX).toBeGreaterThan(1);
    expect(-walkPose(0.5, true, false).dy).toBeLessThan(1); // calm: no hop
    expect(walkPose(0.5, false, true).dy).toBe(0); // rolls
  });

  it('a happy jump goes up and comes back down', () => {
    expect(jumpPose(0, false).dy).toBe(0);
    expect(-jumpPose(0.5, false).dy).toBeGreaterThan(25);
    expect(jumpPose(1, false).dy).toBe(0);
    expect(-jumpPose(0.5, true).dy).toBeLessThan(5);
  });

  it('sleep sways gently', () => {
    expect(Math.abs(sleepPose(0.75, 0, false).rotation)).toBeGreaterThan(0.02);
    expect(Math.abs(sleepPose(0.75, 0, true).rotation)).toBeLessThan(0.02);
  });

  it('tweens run to completion and call onDone once', () => {
    const tw = new Tweens();
    const seen: number[] = [];
    let done = 0;
    tw.add(
      100,
      (t) => seen.push(t),
      ease.linear,
      () => (done += 1),
    );
    tw.update(50);
    tw.update(60);
    tw.update(60);
    expect(seen).toEqual([0.5, 1]);
    expect(done).toBe(1);
    expect(tw.active).toBe(0);
  });
});
