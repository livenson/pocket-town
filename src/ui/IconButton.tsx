import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { playSfx } from '../audio/audio';
import type { SfxName } from '../audio/sfx';
import type { IconName } from '../design/icons';
import { Icon } from './Icon';
import { useShowTextLabels } from './labels';
import { useVoiceLabel } from './useVoiceLabel';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required: used for aria-label, voice-over and the optional text label. */
  label: string;
  /** Desktop keyboard shortcut, shown in the hover label. */
  shortcut?: string;
  /** Toggle state (time control, tabs); rendered as aria-pressed plus a filled look. */
  pressed?: boolean;
  tone?: 'paper' | 'plain';
  sound?: SfxName | null;
  /** Hide the optional text label even when labels are on (dense groups). */
  noTextLabel?: boolean;
}

/** Square icon control: 64 px on tablet, 56 px on phone and desktop. */
export function IconButton({
  icon,
  label,
  shortcut,
  pressed,
  tone = 'paper',
  sound = 'tap',
  noTextLabel = false,
  className,
  onClick,
  ...rest
}: IconButtonProps) {
  const voice = useVoiceLabel(label);
  const textLabels = useShowTextLabels() && !noTextLabel;
  return (
    <span className={['icon-btn-wrap', className ?? ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        {...rest}
        {...voice}
        aria-label={label}
        aria-pressed={pressed}
        aria-keyshortcuts={shortcut}
        className={`icon-btn icon-btn--${tone}`}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          if (sound && !rest['aria-disabled']) playSfx(sound);
          onClick?.(e);
        }}
      >
        <Icon name={icon} />
      </button>
      <span className="hover-tip" aria-hidden="true">
        {label}
        {shortcut && <kbd>{shortcut}</kbd>}
      </span>
      {textLabels && (
        <span className="text-label" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
