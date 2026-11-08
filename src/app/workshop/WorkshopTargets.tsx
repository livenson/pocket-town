// Over the stage in the workshop and the airport: the workbench's faded hint of
// what is still missing, and the departure board (tap it to hear the flights).
import { benchHint } from '../../content/crafting';
import { objectKinds } from '../../content/objects';
import { findRoom } from '../../content/rooms';
import { pictureUrl } from '../../design/thingPicture';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { strings, thingName } from '../../i18n';
import type { World } from '../../sim/types';
import { onBench } from '../../sim/workbench';
import { boardNow, clockDigits } from '../../stage/board';
import { registerTarget } from '../../stage/targets';
import { usePlay } from '../../state/play';
import { Icon } from '../../ui/Icon';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import './workshop.css';

const art = (kind: string) => objectKinds.find((o) => o.id === kind)?.art ?? '';

function BenchHint({ world, roomId, benchId }: { world: World; roomId: string; benchId: string }) {
  const carrying = usePlay((s) => s.carrying !== null);
  const kinds = onBench(world, roomId, benchId).map((o) => o.kind);
  const hint = benchHint(kinds);
  if (!hint || carrying) return null;
  const label = strings.workshop.hintNeeds(
    thingName(hint.makes),
    hint.missing.map((k) => thingName(k)).join(', '),
  );
  return (
    <div ref={(el) => registerTarget(`benchHint:${benchId}`, el)} className="bench-hint">
      <div className="bench-hint__bubble" role="img" aria-label={label}>
        {hint.missing.map((k, i) => (
          <img key={`${k}-${i}`} src={pictureUrl(art(k))} alt="" draggable={false} />
        ))}
        <span className="bench-hint__plus">
          <Icon name="next" size={20} />
        </span>
        <img src={pictureUrl(art(hint.makes))} alt="" draggable={false} />
      </div>
    </div>
  );
}

/** Hints over every workbench in this room. */
export function BenchHints({ world, roomId }: { world: World; roomId: string }) {
  const benches = findRoom(roomId)?.furniture.filter((f) => f.kind === 'workbench') ?? [];
  return (
    <>
      {benches.map((f) => (
        <BenchHint key={`${roomId}-${f.id}`} world={world} roomId={roomId} benchId={f.id} />
      ))}
    </>
  );
}

function boardLabel(): string {
  return boardNow.rows
    .map((r) =>
      strings.board.flight(
        strings.board.places[r.destination],
        clockDigits(r.time),
        strings.board.status[r.status],
      ),
    )
    .join('. ');
}

function BoardTarget({ id }: { id: string }) {
  const carrying = usePlay((s) => s.carrying !== null);
  const name = strings.furnitureNames.departureBoard ?? 'Departure board';
  const voice = useVoiceLabel(name);
  return (
    <button
      ref={(el) => registerTarget(`board:${id}`, el)}
      type="button"
      className="stage-target stage-target--furniture"
      aria-label={`${name}: ${boardLabel()}`}
      tabIndex={carrying ? -1 : 0}
      {...voice}
      onClick={() => {
        playSfx('tap');
        speak(`${name}. ${boardLabel()}`);
      }}
    />
  );
}

/** The departure boards in this room. */
export function BoardTargets({ roomId }: { roomId: string }) {
  const boards = findRoom(roomId)?.furniture.filter((f) => f.kind === 'departureBoard') ?? [];
  return (
    <>
      {boards.map((f) => (
        <BoardTarget key={`${roomId}-${f.id}`} id={f.id} />
      ))}
    </>
  );
}
