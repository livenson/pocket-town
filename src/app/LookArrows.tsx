import { strings } from '../i18n';
import { useUi } from '../state/ui';
import { IconButton } from '../ui/IconButton';

/**
 * When the room is wider than the screen (phone portrait), arrows at the stage's
 * edges move the camera, so doors and furniture at the sides can always be reached.
 */
export function LookArrows() {
  const view = useUi((s) => s.view);
  const look = (dir: -1 | 1) => useUi.getState().setLookX(view.centreX + dir * view.span * 0.6);
  return (
    <>
      {view.canLeft && (
        <IconButton
          className="look-arrow look-arrow--left"
          icon="back"
          label={strings.lookLeft}
          noTextLabel
          sound="soft"
          onClick={() => look(-1)}
        />
      )}
      {view.canRight && (
        <IconButton
          className="look-arrow look-arrow--right"
          icon="next"
          label={strings.lookRight}
          noTextLabel
          sound="soft"
          onClick={() => look(1)}
        />
      )}
    </>
  );
}
