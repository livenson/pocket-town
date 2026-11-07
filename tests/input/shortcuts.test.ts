import { describe, expect, it } from 'vitest';
import { shortcutFor } from '../../src/input/shortcuts';

const key = (
  k: string,
  mods: Partial<KeyboardEvent> = {},
  target: EventTarget | null = document.body,
) =>
  shortcutFor({
    key: k,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    target,
    ...mods,
  });

describe('keyboard shortcuts', () => {
  it('maps the documented keys', () => {
    expect(key('h')).toBe('home');
    expect(key('M')).toBe('map');
    expect(key('e')).toBe('edit');
    expect(key('f')).toBe('faster');
    expect(key('c')).toBe('camera');
    expect(key(' ')).toBe('togglePause');
    expect(key('Escape')).toBe('escape');
    expect(key('?')).toBe('help');
  });

  it('maps undo and redo with Ctrl or Cmd', () => {
    expect(key('z', { ctrlKey: true })).toBe('undo');
    expect(key('z', { metaKey: true, shiftKey: true })).toBe('redo');
    expect(key('h', { ctrlKey: true })).toBeNull();
  });

  it('leaves Space to a focused button and ignores typing', () => {
    const button = document.createElement('button');
    const input = document.createElement('input');
    expect(key(' ', {}, button)).toBeNull();
    expect(key('h', {}, input)).toBeNull();
  });
});
