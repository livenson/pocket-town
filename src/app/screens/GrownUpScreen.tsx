import { useRef } from 'react';
import { LANGUAGES, strings, type Language } from '../../i18n';
import { playSfx } from '../../audio/audio';
import { useSettings } from '../../state/settings';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { ScreenFrame } from './ScreenFrame';

function LanguagePicker() {
  const language = useSettings((s) => s.language);
  const update = useSettings((s) => s.update);
  const choices: { id: Language | 'auto'; name: string }[] = [
    { id: 'auto', name: strings.language.auto },
    ...LANGUAGES.map((l) => ({ id: l.id, name: l.name })),
  ];
  return (
    <section className="grown-up__section" aria-labelledby="language-label">
      <h2 id="language-label" className="grown-up__heading">
        {strings.language.label}
      </h2>
      <div className="language-picker" role="group" aria-labelledby="language-label">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className="language-choice"
            aria-label={c.name}
            aria-pressed={language === c.id}
            lang={c.id === 'auto' ? undefined : c.id}
            onClick={() => {
              playSfx('tap');
              update({ language: c.id });
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="grown-up__note">{strings.language.note}</p>
    </section>
  );
}

/**
 * The version line. A little secret: three quick taps open the piano (it is a
 * real button, so keyboard and screen-reader users can find it too).
 */
function VersionLine() {
  const go = useUi((s) => s.go);
  const taps = useRef<number[]>([]);
  return (
    <button
      type="button"
      className="grown-up__note grown-up__build grown-up__secret"
      onClick={() => {
        const now = Date.now();
        taps.current = [...taps.current.filter((t) => now - t < 1200), now];
        if (taps.current.length >= 3) {
          taps.current = [];
          playSfx('jingle');
          go('piano');
        }
      }}
    >
      <span>{strings.grownUp.version(__BUILD__.version, __BUILD__.date)}</span>
      <span className="visually-hidden">. {strings.piano.open}</span>
    </button>
  );
}

/** Local grown-up area (behind the gate). M8 adds wind-down, reset and export/import. */
export function GrownUpScreen() {
  const go = useUi((s) => s.go);
  return (
    <ScreenFrame title={strings.screens.grownUp} className="screen--grown-up">
      <div className="grown-up">
        <p>{strings.grownUp.intro}</p>
        <LanguagePicker />
        <Button
          variant="secondary"
          icon="sliders"
          label={strings.settings}
          showWord
          onClick={() => go('settings')}
        />
        <Button
          variant="secondary"
          icon="grid4"
          label={strings.grownUp.kit}
          showWord
          onClick={() => go('kit')}
        />
        <p className="grown-up__note">{strings.grownUp.credits}</p>
        <VersionLine />
      </div>
    </ScreenFrame>
  );
}
