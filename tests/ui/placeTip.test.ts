import { describe, expect, it } from 'vitest';
import { placeTip } from '../../src/ui/placeTip';

const view = { w: 1000, h: 700 };
const tip = { w: 120, h: 30 };
const box = (left: number, top: number, size = 56) => ({
  left,
  top,
  right: left + size,
  bottom: top + size,
});

describe('hover label placement', () => {
  it('goes centred under the button', () => {
    expect(placeTip(box(400, 20), tip, view, false)).toEqual({ x: 368, y: 86 });
  });

  it('opens upwards near the bottom edge', () => {
    const p = placeTip(box(400, 630), tip, view, false);
    expect(p.y + tip.h).toBeLessThanOrEqual(630);
  });

  it('stays on screen in the corners', () => {
    for (const b of [box(0, 0), box(944, 0), box(0, 644), box(944, 644)]) {
      const p = placeTip(b, tip, view, false);
      expect(p.x).toBeGreaterThanOrEqual(8);
      expect(p.x + tip.w).toBeLessThanOrEqual(view.w - 8);
      expect(p.y).toBeGreaterThanOrEqual(8);
      expect(p.y + tip.h).toBeLessThanOrEqual(view.h - 8);
    }
  });

  it('sits beside a button in a tall dock, on the side with room', () => {
    expect(placeTip(box(20, 300), tip, view, true).x).toBe(86);
    expect(placeTip(box(924, 300), tip, view, true).x).toBe(924 - 10 - 120);
  });
});
