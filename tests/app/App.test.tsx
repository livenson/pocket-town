import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as audio from '../../src/audio/audio';
import { App } from '../../src/app/App';
import { initialNav } from '../../src/app/machine';
import { useUi } from '../../src/state/ui';

beforeEach(() => {
  useUi.setState({ nav: initialNav, shortcutsOpen: false, plusSheetOpen: false, toasts: [] });
});

describe('App', () => {
  it('starts on the splash: one big button that pops and moves on', () => {
    const play = vi.spyOn(audio, 'playSfx');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /loading/ }));
    expect(play).toHaveBeenCalledWith('tap');
    expect(useUi.getState().nav.screen).toBe('age');
  });

  it('asks the age without anything preselected, then who is playing', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /loading/ }));
    const tiles = screen.getAllByRole('button').filter((b) => b.className === 'age-tile');
    expect(tiles).toHaveLength(12);
    expect(tiles.some((t) => t.getAttribute('aria-pressed') === 'true')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    void act(() => vi.advanceTimersByTime(500));
    expect(useUi.getState().nav.screen).toBe('profile');
    vi.useRealTimers();
  });

  it('opens the shortcuts overlay with "?" and closes it with Escape', () => {
    render(<App />);
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.getByRole('dialog', { name: 'Shortcuts' })).toBeTruthy();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog', { name: 'Shortcuts' })).toBeNull();
  });
});
