import { describe, expect, it } from 'vitest';
import { suitsThing } from '../../src/content/objects';

describe('places that suit a carried thing', () => {
  it('food suits tables and counters, not the bookshelf', () => {
    expect(suitsThing('cake', 'table')).toBe(true);
    expect(suitsThing('cake', 'counter')).toBe(true);
    expect(suitsThing('cake', 'bookshelf')).toBe(false);
  });

  it('a book suits the bookshelf, a tool the workbench', () => {
    expect(suitsThing('storybook', 'bookshelf')).toBe(true);
    expect(suitsThing('hammer', 'workbench')).toBe(true);
    expect(suitsThing('hammer', 'sofa')).toBe(false);
  });

  it('unknown things suit nothing', () => {
    expect(suitsThing('nothing-like-this', 'table')).toBe(false);
  });
});
