import { playSfx } from '../../audio/audio';
import { strings } from '../../i18n/strings.en';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { ScreenFrame } from './ScreenFrame';

const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

/** A2 neutral age screen: nothing preselected; the question is spoken. Age stays on the device. */
export function AgeScreen() {
  const go = useUi((s) => s.go);
  const setActive = useProfiles((s) => s.setActive);
  return (
    <ScreenFrame title={strings.screens.age} nav={false} speakTitle>
      <div className="age-grid" role="group" aria-label={strings.screens.age}>
        {AGES.map((age) => (
          <button
            key={age}
            type="button"
            className="age-tile"
            onClick={() => {
              playSfx('tap');
              setActive({ id: 'local', age });
              go('profile');
            }}
          >
            {age === 15 ? '15+' : age}
          </button>
        ))}
      </div>
    </ScreenFrame>
  );
}
