import { playSfx } from '../../audio/audio';
import { town, type BuildingKind } from '../../content/rooms';
import type { IconName } from '../../design/icons';
import { useUi } from '../../state/ui';
import { buildingName, strings } from '../../i18n';
import { Icon } from '../../ui/Icon';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { ScreenFrame } from './ScreenFrame';

const ICON: Record<BuildingKind, IconName> = {
  house: 'house',
  cafe: 'shop',
  park: 'tree',
  library: 'book',
  musicHall: 'note',
};

function BuildingButton({
  id,
  name,
  kind,
  roof,
}: {
  id: string;
  name: string;
  kind: BuildingKind;
  roof: string;
}) {
  const go = useUi((s) => s.go);
  const setRoom = useUi((s) => s.setRoom);
  const voice = useVoiceLabel(name);
  const building = town.find((b) => b.id === id);
  return (
    <button
      type="button"
      className="map-building"
      style={{ borderTopColor: roof }}
      aria-label={name}
      {...voice}
      onClick={() => {
        playSfx('tap');
        const room = building?.rooms[0];
        if (room) setRoom(room.id);
        go('scene');
      }}
    >
      <Icon name={ICON[kind]} size={56} strokeWidth={3} />
    </button>
  );
}

/** D1 world map. M7 draws the town with bot pins; for now, a way into every building. */
export function MapScreen() {
  return (
    <ScreenFrame title={strings.screens.map}>
      <div className="map-grid">
        {town.map((b) => (
          <BuildingButton
            key={b.id}
            id={b.id}
            name={buildingName(b.id)}
            kind={b.kind}
            roof={b.roofColor}
          />
        ))}
      </div>
    </ScreenFrame>
  );
}
