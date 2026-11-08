// Desktop hover labels (name and keyboard shortcut) for icon buttons, drawn in one
// layer above everything, so a neighbouring button, a dock that clips its overflow
// or the screen edge can never hide them. Buttons opt in with `data-tip` (and
// `data-tip-key` for a shortcut); IconButton does this for every icon button.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeTip } from './placeTip';

interface Tip {
  text: string;
  shortcut: string | null;
  anchor: DOMRect;
  /** In a tall, narrow dock: show beside the button instead of under it. */
  beside: boolean;
}

const desktop = () => document.documentElement.dataset.layout === 'desktop';

function tipFor(el: Element | null): Tip | null {
  const btn = el?.closest<HTMLElement>('[data-tip]');
  if (!btn?.dataset.tip) return null;
  const dock = btn.closest('.dock');
  const d = dock?.getBoundingClientRect();
  return {
    text: btn.dataset.tip,
    shortcut: btn.dataset.tipKey ?? null,
    anchor: btn.getBoundingClientRect(),
    beside: d !== undefined && d.height > d.width * 1.5,
  };
}

export function HoverTips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const show = (el: Element | null) => setTip(desktop() ? tipFor(el) : null);
    const hide = () => setTip(null);
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') show(e.target instanceof Element ? e.target : null);
    };
    const focus = (e: FocusEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches(':focus-visible')) show(t);
      else hide();
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', hide, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  // Measure the label, then place it on screen before it is painted.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !tip) return;
    const { x, y } = placeTip(
      tip.anchor,
      { w: el.offsetWidth, h: el.offsetHeight },
      { w: window.innerWidth, h: window.innerHeight },
      tip.beside,
    );
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    el.style.visibility = 'visible';
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div ref={ref} className="hover-tip" aria-hidden="true">
      {tip.text}
      {tip.shortcut && <kbd>{tip.shortcut}</kbd>}
    </div>,
    document.body,
  );
}
