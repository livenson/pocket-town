import { dropCarried, putAwayCarried } from '../input/carry';
import { objectKinds } from '../content/objects';
import { pictureUrl } from '../design/thingPicture';
import { strings, thingName } from '../i18n';
import { usePlay } from '../state/play';
import { HoldButton } from '../ui/HoldButton';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

/** What is being carried: the drag ghost, the "in hand" pill, and the red-cross mark. */
export function CarryLayer() {
  const carrying = usePlay((s) => s.carrying);
  const dragAt = usePlay((s) => s.dragAt);
  const invalidAt = usePlay((s) => s.invalidAt);
  const kind = carrying ? objectKinds.find((o) => o.id === carrying.kind) : undefined;

  return (
    <>
      {carrying && kind && carrying.mode === 'tap' && (
        <div className="carry-pill" role="status">
          <span className="carry-pill__item" style={{ background: kind.tint }}>
            <img src={pictureUrl(kind.art)} alt="" width={40} height={40} draggable={false} />
          </span>
          <span className="carry-pill__hint" aria-hidden="true">
            <Icon name="hand" size={22} />
          </span>
          <span className="visually-hidden">{strings.carrying(thingName(kind.id))}</span>
          {carrying.source.from === 'object' && (
            <HoldButton label={strings.putAway} onConfirm={putAwayCarried} />
          )}
          <IconButton
            icon="close"
            label={strings.dropIt}
            shortcut="Esc"
            onClick={dropCarried}
            sound={null}
          />
        </div>
      )}
      {carrying && kind && carrying.mode === 'drag' && dragAt && (
        <div
          className="carry-ghost"
          aria-hidden="true"
          style={{ transform: `translate(${dragAt.x}px, ${dragAt.y}px)`, background: kind.tint }}
        >
          <img src={pictureUrl(kind.art)} alt="" width={56} height={56} draggable={false} />
        </div>
      )}
      {invalidAt && (
        // Keyed by id so each miss replays the fade; it ends invisible (CSS).
        <div
          key={invalidAt.id}
          className="invalid-mark"
          aria-hidden="true"
          style={{ transform: `translate(${invalidAt.x}px, ${invalidAt.y}px)` }}
        >
          <Icon name="close" size={30} strokeWidth={3.4} />
        </div>
      )}
    </>
  );
}
