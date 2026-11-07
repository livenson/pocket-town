import { useUi } from '../state/ui';
import { Icon } from './Icon';

/** Non-blocking messages that dismiss themselves. Icon first; the word is for screen readers and older kids. */
export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} type="button" className="toast" onClick={() => dismiss(t.id)}>
          <span className="toast__icon">
            <Icon name={t.icon} size={26} />
          </span>
          <span className="toast__text">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
