import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import type { IconName } from '../design/icons';
import { strings } from '../i18n';
import { Icon } from '../ui/Icon';
import { useShowTextLabels } from '../ui/labels';
import { hint, useHints, type HintStep } from './hints';

const ICON: Record<HintStep, IconName> = {
  plus: 'plus',
  cake: 'cake',
  give: 'hand',
  fed: 'heart',
  map: 'map',
};

/** The current first-play hint: a picture (and words for older children); tap to hear it. */
export function HintBubble() {
  const step = useHints((s) => s.step);
  const words = useShowTextLabels();
  if (!step) return null;
  const text = strings.hints[step];
  return (
    <div className="hint-bubble-wrap">
      <button
        type="button"
        className="hint-bubble"
        aria-label={`${strings.hints.hear}: ${text}`}
        onClick={() => speak(text)}
      >
        <span className="hint-bubble__icon" aria-hidden="true">
          <Icon name={ICON[step]} size={26} />
        </span>
        {words && <span aria-hidden="true">{text}</span>}
      </button>
      <button
        type="button"
        className="hint-bubble__close"
        aria-label={strings.hints.hide}
        onClick={() => {
          playSfx('soft');
          hint.dismiss();
        }}
      >
        <Icon name="close" size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
