import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { ScreenFrame } from './ScreenFrame';

/** Local grown-up area (behind the gate). M8 adds wind-down, reset and export/import. */
export function GrownUpScreen() {
  const go = useUi((s) => s.go);
  return (
    <ScreenFrame title={strings.screens.grownUp} className="screen--grown-up">
      <div className="grown-up">
        <p>{strings.grownUp.intro}</p>
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
      </div>
    </ScreenFrame>
  );
}
