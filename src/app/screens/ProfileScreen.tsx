import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { ScreenFrame } from './ScreenFrame';

/** B1 profile select (faces only). M5 adds real profiles; for now one "new player" tile. */
export function ProfileScreen() {
  const go = useUi((s) => s.go);
  return (
    <ScreenFrame
      title={strings.screens.profile}
      nav={false}
      speakTitle
      actions={<IconButton icon="lock" label={strings.grownUps} onClick={() => go('gate')} />}
    >
      <div className="tile-row">
        <Button
          variant="primary"
          icon="plus"
          label={strings.screens.avatarWizard}
          className="big-tile"
          onClick={() => go('hub')}
        />
      </div>
    </ScreenFrame>
  );
}
