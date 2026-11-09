import { describe, expect, it } from 'vitest';
import { findRoom } from '../../src/content/rooms';
import { roomSummary } from '../../src/content/roomSummary';

const summary = (id: string) => {
  const room = findRoom(id);
  if (!room) throw new Error(id);
  return roomSummary(room);
};

describe('what a room is for, at a glance', () => {
  it('the kitchen shows its stove first and a fork', () => {
    expect(summary('home-living').kinds[0]).toBe('stove');
    expect(summary('home-living').icon).toBe('fork');
  });

  it('the bedroom shows a bed, the bathroom its bathtub and toilet', () => {
    expect(summary('home-bedroom').kinds).toContain('bed');
    expect(summary('home-bath').kinds.slice(0, 2)).toEqual(['bathtub', 'toilet']);
  });

  it('a playroom with a bunk bed is still a playroom', () => {
    expect(summary('home-play').icon).toBe('ball');
  });

  it('never more than three pieces', () => {
    expect(summary('home-play').kinds.length).toBeLessThanOrEqual(3);
  });
});
