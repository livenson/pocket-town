import { useRef, useState, type ReactNode } from 'react';
import type { PointerEvent } from 'react';
import { playSfx } from '../audio/audio';
import { strings } from '../i18n/strings.en';
import { IconButton } from './IconButton';

export interface CarouselProps {
  label: string;
  items: ReactNode[];
  /** Tiles per page (4–8 by design). */
  perPage: number;
  /** Grid columns; defaults to perPage (one row). */
  columns?: number;
  /** Controlled page (optional). */
  page?: number;
  onPageChange?: (page: number) => void;
}

const SWIPE_PX = 50;

/** Paged grid: arrow buttons and page dots. Swipe also works, but is never required. */
export function Carousel({
  label,
  items,
  perPage,
  columns,
  page: controlledPage,
  onPageChange,
}: CarouselProps) {
  const [ownPage, setOwnPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(controlledPage ?? ownPage, pages - 1);
  const swipeStart = useRef<number | null>(null);

  const setPage = (next: number) => {
    const clamped = Math.max(0, Math.min(pages - 1, next));
    if (clamped === page) return;
    setOwnPage(clamped);
    onPageChange?.(clamped);
  };

  const visible = items.slice(page * perPage, page * perPage + perPage);

  return (
    <div className="carousel" role="group" aria-roledescription="carousel" aria-label={label}>
      {pages > 1 && (
        <IconButton
          icon="back"
          label={strings.previous}
          noTextLabel
          aria-disabled={page === 0 || undefined}
          sound={page === 0 ? null : 'tap'}
          onClick={() => setPage(page - 1)}
        />
      )}
      <div
        className="carousel__page"
        style={{ gridTemplateColumns: `repeat(${columns ?? perPage}, minmax(0, 1fr))` }}
        aria-label={strings.pageOf(page + 1, pages)}
        role="group"
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeStart.current === null) return;
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(dx) > SWIPE_PX) {
            playSfx('tap');
            setPage(page + (dx < 0 ? 1 : -1));
          }
        }}
      >
        {visible}
      </div>
      {pages > 1 && (
        <IconButton
          icon="next"
          label={strings.next}
          noTextLabel
          aria-disabled={page === pages - 1 || undefined}
          sound={page === pages - 1 ? null : 'tap'}
          onClick={() => setPage(page + 1)}
        />
      )}
      {pages > 1 && (
        <div className="carousel__dots">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className="carousel__dot"
              aria-label={strings.pageOf(i + 1, pages)}
              aria-current={i === page ? 'page' : undefined}
              onClick={() => {
                playSfx('tap');
                setPage(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
