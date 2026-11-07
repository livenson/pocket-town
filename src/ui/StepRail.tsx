import { playSfx } from '../audio/audio';
import type { IconName } from '../design/icons';
import { Icon } from './Icon';
import { useShowTextLabels } from './labels';
import { useVoiceLabel } from './useVoiceLabel';

export interface Step {
  id: string;
  icon: IconName;
  label: string;
  done?: boolean;
}

export interface StepRailProps {
  label: string;
  steps: Step[];
  current: string;
  onSelect: (id: string) => void;
}

function StepButton({
  step,
  current,
  onSelect,
}: {
  step: Step;
  current: boolean;
  onSelect: (id: string) => void;
}) {
  const voice = useVoiceLabel(step.label);
  const textLabels = useShowTextLabels();
  return (
    <li className="step-rail__item">
      <button
        type="button"
        className="step-rail__step"
        aria-label={step.label}
        aria-current={current ? 'step' : undefined}
        data-done={step.done || undefined}
        {...voice}
        onClick={() => {
          playSfx('tap');
          onSelect(step.id);
        }}
      >
        <Icon name={step.icon} />
        {step.done && (
          <span className="step-rail__tick" aria-hidden="true">
            <Icon name="check" size={16} strokeWidth={3.4} />
          </span>
        )}
      </button>
      {textLabels && (
        <span className="text-label" aria-hidden="true">
          {step.label}
        </span>
      )}
    </li>
  );
}

/** Icon steps that can be visited in any order. Current = tomato; done = teal tick badge. */
export function StepRail({ label, steps, current, onSelect }: StepRailProps) {
  return (
    <nav aria-label={label}>
      <ol className="step-rail">
        {steps.map((s) => (
          <StepButton key={s.id} step={s} current={s.id === current} onSelect={onSelect} />
        ))}
      </ol>
    </nav>
  );
}
