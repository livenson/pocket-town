import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { ScreenFrame } from './ScreenFrame';

/** D1 world map. M7 draws the town; for now one way into the house. */
export function MapScreen() {
  const go = useUi((s) => s.go);
  return (
    <ScreenFrame title={strings.screens.map}>
      <div className="tile-row">
        <Button
          variant="secondary"
          icon="house"
          label={strings.hub.myHouse}
          className="big-tile"
          onClick={() => go('scene')}
        />
      </div>
    </ScreenFrame>
  );
}
