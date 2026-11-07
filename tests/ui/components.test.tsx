import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Carousel } from '../../src/ui/Carousel';
import { HoldButton } from '../../src/ui/HoldButton';
import { IconButton } from '../../src/ui/IconButton';
import { StepRail } from '../../src/ui/StepRail';
import { Switch } from '../../src/ui/Switch';
import { useSettings } from '../../src/state/settings';

describe('IconButton', () => {
  it('uses its label as the accessible name and shows text labels only when on', () => {
    const { unmount } = render(<IconButton icon="map" label="Map" shortcut="M" />);
    expect(screen.getByRole('button', { name: 'Map' }).getAttribute('aria-keyshortcuts')).toBe('M');
    expect(document.querySelector('.text-label')).toBeNull();
    unmount();
    useSettings.setState({ textLabels: true });
    render(<IconButton icon="map" label="Map" shortcut="M" />);
    expect(document.querySelector('.text-label')?.textContent).toBe('Map');
    cleanup();
    useSettings.setState({ textLabels: false });
  });
});

describe('Switch', () => {
  it('is a switch with aria-checked and toggles', () => {
    const onChange = vi.fn<(on: boolean) => void>();
    render(<Switch label="Calm motion" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Calm motion' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('HoldButton', () => {
  it('confirms only after a full hold, and cancels on early release', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const onConfirm = vi.fn<() => void>();
    render(<HoldButton label="Hold to delete" onConfirm={onConfirm} />);
    const b = screen.getByRole('button', { name: 'Hold to delete' });

    fireEvent.pointerDown(b, { pointerId: 1 });
    void act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerUp(b, { pointerId: 1 });
    void act(() => vi.advanceTimersByTime(800));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.pointerDown(b, { pointerId: 1 });
    void act(() => vi.advanceTimersByTime(800));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('a pointer press is not cancelled by the "leave" events capture sends', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const onConfirm = vi.fn<() => void>();
    render(<HoldButton label="Hold to delete" onConfirm={onConfirm} />);
    const b = screen.getByRole('button', { name: 'Hold to delete' });
    fireEvent.pointerDown(b, { pointerId: 1 });
    fireEvent.pointerLeave(b, { pointerId: 1 });
    void act(() => vi.advanceTimersByTime(800));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('works by holding Space', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const onConfirm = vi.fn<() => void>();
    render(<HoldButton label="Hold to delete" onConfirm={onConfirm} />);
    const b = screen.getByRole('button', { name: 'Hold to delete' });
    fireEvent.keyDown(b, { key: ' ' });
    void act(() => vi.advanceTimersByTime(800));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('Carousel', () => {
  it('pages with arrows and dots', () => {
    render(
      <Carousel
        label="Things"
        perPage={2}
        items={['a', 'b', 'c', 'd', 'e'].map((x) => (
          <span key={x}>{x}</span>
        ))}
      />,
    );
    expect(screen.getByText('a')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('c')).toBeTruthy();
    expect(screen.queryByText('a')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Page 3 of 3' }));
    expect(screen.getByText('e')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page 3 of 3' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });
});

describe('StepRail', () => {
  it('marks the current step and done steps', () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(
      <StepRail
        label="Steps"
        current="hair"
        onSelect={onSelect}
        steps={[
          { id: 'face', icon: 'face', label: 'Face', done: true },
          { id: 'hair', icon: 'hair', label: 'Hair' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Hair' }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: 'Face' }).dataset.done).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Face' }));
    expect(onSelect).toHaveBeenCalledWith('face');
  });
});
