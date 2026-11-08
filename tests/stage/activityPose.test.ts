import { describe, expect, it } from 'vitest';
import type { FurnitureInstance } from '../../src/content/furniture';
import { gestureFor, placementOn } from '../../src/stage/activityPose';

const S = 122;
const sofa: FurnitureInstance = { id: 's', kind: 'sofa', x: 600, y: 300 };
const bed: FurnitureInstance = { id: 'b', kind: 'bed', x: 100, y: 330 };
const chairs: FurnitureInstance = { id: 'w', kind: 'waitingChairs', x: 200, y: 300 };

describe('how characters hold themselves', () => {
  it('each kind of activity has its own gesture', () => {
    expect(gestureFor('eat')).toBe('eat');
    expect(gestureFor('read')).toBe('read');
    expect(gestureFor('chat')).toBe('talk');
    expect(gestureFor('tinker')).toBe('hammer');
    expect(gestureFor('wander')).toBe('none');
  });

  it('napping on a sofa sits on the cushion, in front of the sofa, near where they stood', () => {
    const p = placementOn(sofa, 'nap', 0, 700, S);
    expect(p?.stance).toBe('sit');
    expect(p?.at.x).toBe(700);
    expect(p?.at.y).toBeLessThan(300 + 58);
    expect(p?.z).toBeGreaterThan(300 + 80);
    // Never past the arms.
    expect(placementOn(sofa, 'nap', 0, 2000, S)?.at.x).toBeLessThan(600 + 238);
  });

  it('a row of chairs: the nearest seat', () => {
    expect(placementOn(chairs, 'nap', 0, 335, S)?.at.x).toBe(200 + 129);
  });

  it('sleeping in a bed lies with the head on the pillow; two sleepers get two pillows', () => {
    const a = placementOn(bed, 'sleep', 0, 200, S);
    const b = placementOn(bed, 'sleep', 1, 200, S);
    expect(a?.stance).toBe('lie');
    expect(a?.at).toEqual({ x: 152, y: 384 });
    expect(b?.at).not.toEqual(a?.at);
    // A bed turned the other way: the pillow is on the right, the head points right.
    const flipped = placementOn({ ...bed, flip: true }, 'sleep', 0, 200, S);
    expect(flipped?.facing).toBe(-1);
    expect(flipped?.at.x).toBe(100 + 200 - 52);
  });

  it('other activities on furniture stand in front of it', () => {
    expect(placementOn(bed, 'tidy', 0, 200, S)).toBeNull();
    expect(placementOn({ id: 't', kind: 'table', x: 0, y: 0 }, 'eat', 0, 50, S)).toBeNull();
  });
});
