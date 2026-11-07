import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as audio from '../../src/audio/audio';
import { App } from '../../src/app/App';

describe('App placeholder', () => {
  it('shows the title and an accessible Play button', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pocket Town');
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('plays the pop sound on every tap', () => {
    const play = vi.spyOn(audio, 'playSfx');
    render(<App />);
    const button = screen.getByRole('button', { name: 'Play' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(play).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledWith('pop');
  });
});
