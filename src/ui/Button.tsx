import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { playSfx } from '../audio/audio';
import type { SfxName } from '../audio/sfx';
import type { IconName } from '../design/icons';
import { strings } from '../i18n/strings.en';
import { Icon } from './Icon';
import { useShowTextLabels } from './labels';
import { useVoiceLabel } from './useVoiceLabel';

export type ButtonVariant = 'primary' | 'secondary' | 'dice' | 'done';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  /** Accessible name, voice-over text and the optional word on the button. */
  label?: string;
  icon?: IconName;
  /** Always show the word (grown-up screens); otherwise it follows the text-label setting. */
  showWord?: boolean;
  /** Sound on press; `null` for silence. */
  sound?: SfxName | null;
}

const DEFAULTS: Record<ButtonVariant, { icon?: IconName; label?: string; sound: SfxName }> = {
  primary: { sound: 'tap' },
  secondary: { sound: 'tap' },
  dice: { icon: 'dice', label: strings.surpriseMe, sound: 'dice' },
  done: { icon: 'check', label: strings.done, sound: 'confirm' },
};

/** Pressable "toy" button: solid bottom shadow that compresses when pressed. */
export function Button({
  variant = 'primary',
  label,
  icon,
  showWord = false,
  sound,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const defaults = DEFAULTS[variant];
  const name = label ?? defaults.label ?? '';
  const glyph = icon ?? defaults.icon;
  const textLabels = useShowTextLabels();
  const voice = useVoiceLabel(name);
  const iconOnly = variant === 'dice' || variant === 'done';
  const word = !iconOnly && (showWord || textLabels || !glyph);
  const effect = sound === undefined ? defaults.sound : sound;

  return (
    <button
      type="button"
      {...rest}
      {...voice}
      aria-label={name}
      className={['btn', `btn--${variant}`, word ? 'btn--word' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (effect) playSfx(effect);
        onClick?.(e);
      }}
    >
      {glyph && <Icon name={glyph} size={iconOnly ? 44 : 32} strokeWidth={iconOnly ? 3 : 2.8} />}
      {word && (
        <span className="btn__word" aria-hidden="true">
          {name}
        </span>
      )}
    </button>
  );
}
