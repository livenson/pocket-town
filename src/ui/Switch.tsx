import { playSfx } from '../audio/audio';
import { Icon } from './Icon';
import { useVoiceLabel } from './useVoiceLabel';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Show the label as text beside the switch (settings rows). */
  showLabel?: boolean;
}

/** On/off switch. State is shown by knob position and a tick, never colour alone. */
export function Switch({ label, checked, onChange, showLabel = false }: SwitchProps) {
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      {...voice}
      onClick={() => {
        playSfx(checked ? 'soft' : 'tap');
        onChange(!checked);
      }}
    >
      {showLabel && (
        <span className="switch__label" aria-hidden="true">
          {label}
        </span>
      )}
      <span className="switch__track" data-on={checked || undefined}>
        <span className="switch__knob">
          <Icon name={checked ? 'check' : 'minus'} size={22} strokeWidth={3} />
        </span>
      </span>
    </button>
  );
}
