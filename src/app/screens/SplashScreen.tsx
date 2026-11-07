import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';

/** A1 splash. M5 adds the animated town build-up while assets load. */
export function SplashScreen() {
  const go = useUi((s) => s.go);
  return (
    <main className="splash">
      <h1 className="splash__title">{strings.appName}</h1>
      <Button
        variant="primary"
        icon="play"
        label={strings.play}
        className="splash__play"
        onClick={() => go('age')}
      />
    </main>
  );
}
