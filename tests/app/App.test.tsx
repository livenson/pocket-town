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
  it('starts on the splash with an accessible Play button that pops', () => {
    const play = vi.spyOn(audio, 'playSfx');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pocket Town');
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(play).toHaveBeenCalledWith('tap');
    expect(useUi.getState().nav.screen).toBe('age');
  });

  it('walks from age to the hub and into the scene', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: 'Make a character' }));
    expect(useUi.getState().nav.screen).toBe('hub');
    fireEvent.click(screen.getByRole('button', { name: 'World' }));
    fireEvent.click(screen.getByRole('button', { name: 'My house' }));
    expect(useUi.getState().nav.screen).toBe('scene');
    expect(screen.getByRole('group', { name: 'Time' })).toBeTruthy();
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
