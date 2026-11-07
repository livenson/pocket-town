import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { strings } from '../../i18n';
import { useCreation } from '../../state/creation';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useShowTextLabels } from '../../ui/labels';

const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
const CANDLES = ['#EF4B2F', '#FFB627', '#0FA394', '#4F6BF0'];

/** A2 neutral age screen: nothing preselected; the question is spoken. Age stays on the device. */
export function AgeScreen() {
  const go = useUi((s) => s.go);
  const setAge = useCreation((s) => s.setAge);
  const setActive = useProfiles((s) => s.setActive);
  const [picked, setPicked] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const words = useShowTextLabels();
  const title = strings.screens.age;

  useEffect(() => {
    speak(title);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [title]);

  return (
    <div className="screen screen--age">
      <header className="onboard-head">
        <IconButton
          icon="speaker"
          label={strings.onboarding.hearQuestion}
          className="speak-btn"
          onClick={() => speak(title)}
        />
        <h1 className="onboard-title" tabIndex={-1}>
          {title}
        </h1>
      </header>
      <div className="age-cake" aria-hidden="true">
        <Icon name="cake" size={44} />
        <span className="age-cake__candles">
          {CANDLES.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </span>
      </div>
      <main className="age-grid" role="group" aria-label={title}>
        {AGES.map((age) => (
          <button
            key={age}
            type="button"
            className="age-tile"
            aria-pressed={picked === age}
            onClick={() => {
              if (picked !== null) return;
              playSfx('tap');
              setPicked(age);
              setAge(age);
              // While choosing, word labels follow the age (on for 9 and up).
              setActive({ id: 'new', age });
              // Already making a new player from the profile screen? Go on to the dice.
              const making = useProfiles.getState().profiles.length > 0;
              timer.current = setTimeout(() => go(making ? 'diceAvatar' : 'profile'), 380);
            }}
          >
            {age === 15 ? '15+' : age}
          </button>
        ))}
      </main>
      <button type="button" className="grown-up-link" onClick={() => go('gate')}>
        <Icon name="lock" size={24} />
        {words ? (
          <span>{strings.onboarding.grownUpSetup}</span>
        ) : (
          <span className="visually-hidden">{strings.onboarding.grownUpSetup}</span>
        )}
      </button>
    </div>
  );
}
