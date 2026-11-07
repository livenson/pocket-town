// What you can do with the picked piece: turn, copy, take away (press and hold).
// For a room in a house the child built, a way back into the house wizard.
import { strings } from '../../i18n';
import { useDecor } from '../../state/decor';
import { useUi } from '../../state/ui';
import { HoldButton } from '../../ui/HoldButton';
import { IconButton } from '../../ui/IconButton';
import { game, useGame } from '../game';
import { copyPiece, pieceById, removePiece, turnPiece } from './decorate';

export function DecorToolbar() {
  const selectedId = useDecor((s) => s.selectedId);
  const roomId = useUi((s) => s.roomId);
  const go = useUi((s) => s.go);
  useGame((s) => s.version);
  const f = pieceById(selectedId);
  const house = game.world.houses.find((h) => roomId.startsWith(`${h.id}-`));
  if (!f && !house) return null;
  return (
    <div className="decor-toolbar" role="toolbar" aria-label={strings.decorate.start}>
      {f && (
        <>
          <IconButton
            icon="rotate"
            label={strings.decorate.turn}
            shortcut="R"
            onClick={() => turnPiece(f)}
          />
          <IconButton
            icon="dup"
            label={strings.decorate.copy}
            shortcut="C"
            onClick={() => copyPiece(f)}
          />
          <HoldButton label={strings.decorate.remove} onConfirm={() => removePiece(f)} />
        </>
      )}
      {!f && house && (
        <IconButton
          icon="house"
          label={strings.decorate.house}
          onClick={() => {
            useDecor.getState().setOn(false);
            useUi.getState().setEditingHouse(house.id);
            go('houseWizard');
          }}
        />
      )}
    </div>
  );
}
