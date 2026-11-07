import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { PointerEvent } from 'react';
import { playSfx } from '../audio/audio';
import { strings } from '../i18n/strings.en';
import { IconButton } from './IconButton';

export interface SheetProps {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra controls placed beside the close button (for example tabs). */
  header?: ReactNode;
}

const DRAG_CLOSE_PX = 80;

/** Bottom sheet with a drag handle and a close button. Escape and the backdrop close it. */
export function Sheet({ open, label, onClose, children, header }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const dragStart = useRef<number | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    restoreFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = panel.current?.querySelector<HTMLElement>('button, [href], input, [tabindex]');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const close = () => {
    playSfx('soft');
    onClose();
  };

  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={close} aria-hidden="true" />
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span id={titleId} className="visually-hidden">
          {label}
        </span>
        <div
          className="sheet__handle"
          aria-hidden="true"
          onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
            dragStart.current = e.clientY;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragStart.current === null || !panel.current) return;
            const dy = Math.max(0, e.clientY - dragStart.current);
            panel.current.style.transform = `translateY(${dy}px)`;
          }}
          onPointerUp={(e) => {
            if (dragStart.current === null) return;
            const dy = e.clientY - dragStart.current;
            dragStart.current = null;
            if (panel.current) panel.current.style.transform = '';
            if (dy > DRAG_CLOSE_PX) close();
          }}
        >
          <span />
        </div>
        <div className="sheet__header">
          <div className="sheet__header-main">{header}</div>
          <IconButton
            icon="close"
            label={strings.close}
            tone="paper"
            onClick={close}
            sound={null}
          />
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
