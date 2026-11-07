// The furniture catalogue while decorating: tap a piece to carry it (then tap the
// room), or drag it straight into the room.
import { useRef, useState, type PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { catalogue, type CatalogueId, type FurnitureKindId } from '../../content/furniture';
import { strings } from '../../i18n';
import { useDecor } from '../../state/decor';
import { useUi } from '../../state/ui';
import { clientToRoom } from '../../stage/targets';
import { stage as stageSize } from '../../design/tokens';
import { Carousel } from '../../ui/Carousel';
import { IconButton } from '../../ui/IconButton';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { addPiece, newPieceId, pieceAt } from './decorate';
import { FurnitureThumb } from './FurnitureThumb';

const DRAG_PX = 8;

/** The room point under a screen point, or null when it is not over the room. */
function overRoom(clientX: number, clientY: number): { x: number; y: number } | null {
  const host = document.querySelector('.stage-host')?.getBoundingClientRect();
  if (
    !host ||
    clientX < host.left ||
    clientX > host.right ||
    clientY < host.top ||
    clientY > host.bottom
  )
    return null;
  const p = clientToRoom(clientX, clientY);
  if (!p || p.x < 0 || p.x > stageSize.roomWidth || p.y < 0 || p.y > stageSize.roomHeight)
    return null;
  return p;
}

function PieceTile({ kind }: { kind: FurnitureKindId }) {
  const name = strings.furnitureNames[kind] ?? kind;
  const voice = useVoiceLabel(name);
  const words = useShowTextLabels();
  const carrying = useDecor((s) => s.carryingKind === kind);
  const drag = useRef<{ sx: number; sy: number; id: string; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, id: newPieceId(), moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_PX) return;
    d.moved = true;
    const p = overRoom(e.clientX, e.clientY);
    useDecor.getState().setPreview(p ? pieceAt({ id: d.id, kind }, p.x, p.y) : null);
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    justDragged.current = true;
    useDecor.getState().setPreview(null);
    const p = overRoom(e.clientX, e.clientY);
    if (p) addPiece(kind, p.x, p.y);
    else playSfx('soft');
  };

  return (
    <button
      type="button"
      className="object-tile furniture-tile"
      aria-label={name}
      aria-pressed={carrying}
      {...voice}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        useDecor.getState().setPreview(null);
      }}
      onClick={() => {
        if (justDragged.current) {
          justDragged.current = false;
          return;
        }
        playSfx(carrying ? 'soft' : 'pick');
        useDecor.getState().carry(carrying ? null : kind);
        // On a phone the catalogue is a sheet: get it out of the way of the room.
        if (!carrying) useUi.getState().setPlusSheetOpen(false);
      }}
    >
      <FurnitureThumb kind={kind} size={58} />
      {words && (
        <span className="object-tile__name" aria-hidden="true">
          {name}
        </span>
      )}
    </button>
  );
}

export function FurnitureDrawer({ perPage, columns }: { perPage: number; columns?: number }) {
  const [category, setCategory] = useState<CatalogueId>('sit');
  const kinds = catalogue.find((c) => c.id === category)?.kinds ?? [];
  const label = strings.decorate.categories[category] ?? category;
  return (
    <div className="drawer drawer--furniture">
      <div className="drawer__tabs" role="group" aria-label={strings.decorate.catalogue}>
        {catalogue.map((c) => (
          <IconButton
            key={c.id}
            icon={c.icon}
            label={strings.decorate.categories[c.id] ?? c.id}
            tone="plain"
            noTextLabel
            pressed={c.id === category}
            className="drawer__tab"
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>
      <Carousel
        key={category}
        label={label}
        perPage={perPage}
        columns={columns}
        items={kinds.map((k) => (
          <PieceTile key={k} kind={k} />
        ))}
      />
    </div>
  );
}
