import { useEffect, useRef, type ReactNode } from 'react';
import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { IconButton } from '../../ui/IconButton';
import { speak } from '../../audio/speech';

export interface ScreenFrameProps {
  title: string;
  children: ReactNode;
  /** Show back and home (true on every screen except the very first ones). */
  nav?: boolean;
  /** Controls on the top-right edge. */
  actions?: ReactNode;
  /** Speak the title on entry (screens that ask a question). */
  speakTitle?: boolean;
  /** Visually show the title (always present for screen readers). */
  showTitle?: boolean;
  className?: string;
}

/** Common screen layout: back/home top-left, actions top-right, content in the middle. */
export function ScreenFrame({
  title,
  children,
  nav = true,
  actions,
  speakTitle = false,
  showTitle = true,
  className,
}: ScreenFrameProps) {
  const back = useUi((s) => s.back);
  const home = useUi((s) => s.home);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Move focus to the new screen for keyboard and screen-reader users.
    heading.current?.focus({ preventScroll: true });
    if (speakTitle) speak(title);
  }, [title, speakTitle]);

  return (
    <div className={['screen', className ?? ''].filter(Boolean).join(' ')}>
      <header className="screen__bar">
        <div className="screen__bar-start">
          {nav && <IconButton icon="back" label={strings.back} shortcut="Esc" onClick={back} />}
          {nav && <IconButton icon="home" label={strings.home} shortcut="H" onClick={home} />}
        </div>
        <h1
          ref={heading}
          tabIndex={-1}
          className={showTitle ? 'screen__title' : 'screen__title visually-hidden'}
        >
          {title}
        </h1>
        <div className="screen__bar-end">{actions}</div>
      </header>
      <main className="screen__body">{children}</main>
    </div>
  );
}
