import { useEffect } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { strings } from '../../i18n';
import { useCreation } from '../../state/creation';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { finishCreation } from '../game';

/** One big dice that rerolls look and name; pencil opens the full wizard; tick goes on. */
export function DiceAvatarScreen() {
  const go = useUi((s) => s.go);
  const back = useUi((s) => s.back);
  const { appearance, name, rolls, roll } = useCreation();
  const help = strings.onboarding.rollHelp;

  useEffect(() => speak(help), [help]);

  return (
    <div className="screen screen--dice">
      <header className="onboard-head">
        <IconButton icon="back" label={strings.back} onClick={back} />
        <span className="onboard-head__end">
          <IconButton
            icon="speaker"
            label={strings.onboarding.hearHelp}
            className="speak-btn"
            onClick={() => speak(help)}
          />
        </span>
      </header>
      <h1 className="visually-hidden">{strings.screens.diceAvatar}</h1>
      <main className="dice-stage">
        <span className="dice-stage__disc" aria-hidden="true" />
        <span
          key={rolls}
          className="dice-stage__peg"
          role="img"
          aria-label={`${strings.onboarding.yourCharacter}: ${name}`}
        >
          <PegPortrait appearance={appearance} size={300} />
        </span>
        <span className="dice-stage__floor" aria-hidden="true" />
        <span className="name-pill" aria-hidden="true">
          {name}
        </span>
      </main>
      <div className="dice-controls">
        <IconButton
          icon="pencil"
          label={strings.onboarding.changeDetails}
          onClick={() => go('avatarWizard')}
        />
        <button
          type="button"
          className="dice-button"
          aria-label={strings.onboarding.roll}
          onClick={() => {
            playSfx('dice');
            roll();
            speak(useCreation.getState().name);
          }}
        >
          <span key={rolls} className="dice-button__face" data-rolled={rolls > 0 || undefined}>
            <Icon name="dice" size={70} strokeWidth={3} />
          </span>
        </button>
        <button
          type="button"
          className="done-button"
          aria-label={strings.done}
          onClick={() => {
            playSfx('confirm');
            void finishCreation().then(() => go('hooray'));
          }}
        >
          <Icon name="check" size={40} strokeWidth={3.2} />
        </button>
      </div>
    </div>
  );
}
