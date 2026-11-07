import { useEffect, useRef } from 'react';
import { strings } from '../i18n/strings.en';
import { useUi } from '../state/ui';
import { IconButton } from '../ui/IconButton';

/** "?" overlay listing the desktop keyboard shortcuts. */
export function ShortcutsOverlay() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;
  return (
    <div className="overlay">
      <div className="overlay__backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
      <div
        ref={panel}
        className="overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="overlay__head">
          <h2 id="shortcuts-title" className="overlay__title">
            {strings.shortcuts}
          </h2>
          <IconButton icon="close" label={strings.close} onClick={() => setOpen(false)} />
        </div>
        <dl className="shortcut-list">
          {strings.shortcutList.map(([key, what]) => (
            <div key={key} className="shortcut-list__row">
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
