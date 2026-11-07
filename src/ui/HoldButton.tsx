import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import type { IconName } from '../design/icons';
import { motion } from '../design/tokens';
import { Icon } from './Icon';
import { useShowTextLabels } from './labels';

export interface HoldButtonProps {
  icon?: IconName;
  label: string;
  /** Called once the ring has filled. */
  onConfirm: () => void;
  durationMs?: number;
  disabled?: boolean;
}

const isHoldKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';

const R = 34;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Press and hold for anything destructive. A ring fills over 700 ms; letting go,
 * sliding off or losing focus early cancels. Keyboard: hold Space or Enter.
 */
export function HoldButton({
  icon = 'trash',
  label,
  onConfirm,
  durationMs = motion.holdToConfirm,
  disabled = false,
}: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const startedAt = useRef<number | null>(null);
  const textLabels = useShowTextLabels();

  const stop = useCallback((cancelled: boolean) => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    if (cancelled && startedAt.current !== null) playSfx('soft');
    startedAt.current = null;
    setProgress(0);
  }, []);

  const start = useCallback(() => {
    if (disabled || startedAt.current !== null) return;
    startedAt.current = performance.now();
    const tick = (now: number) => {
      if (startedAt.current === null) return;
      const p = Math.min(1, (now - startedAt.current) / durationMs);
      setProgress(p);
      if (p >= 1) {
        startedAt.current = null;
        frame.current = undefined;
        setProgress(0);
        playSfx('confirm');
        onConfirm();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [disabled, durationMs, onConfirm]);

  useEffect(() => () => stop(false), [stop]);

  return (
    <span className="icon-btn-wrap">
      <button
        type="button"
        className="hold-btn"
        aria-label={label}
        aria-disabled={disabled || undefined}
        data-holding={progress > 0 || undefined}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          start();
        }}
        onPointerUp={() => stop(true)}
        onPointerCancel={() => stop(true)}
        onLostPointerCapture={() => stop(true)}
        // With pointer capture the browser sends "leave" events at the start of a
        // press, so sliding off is checked by position instead.
        onPointerMove={(e: PointerEvent<HTMLButtonElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          const off =
            e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
          if (off) stop(true);
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') speak(label);
        }}
        onBlur={() => stop(true)}
        onKeyDown={(e) => {
          if (!isHoldKey(e)) return;
          e.preventDefault();
          if (!e.repeat) start();
        }}
        onKeyUp={(e) => {
          if (isHoldKey(e)) stop(true);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg className="hold-btn__ring" viewBox="0 0 76 76" aria-hidden="true">
          <circle className="hold-btn__track" cx="38" cy="38" r={R} />
          <circle
            className="hold-btn__fill"
            cx="38"
            cy="38"
            r={R}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <span className="hold-btn__face">
          <Icon name={icon} />
        </span>
      </button>
      {textLabels && (
        <span className="text-label" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
