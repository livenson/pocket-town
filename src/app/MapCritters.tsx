// Animals wandering the world map (a play-tester asked for some). Each strolls
// about its own patch; tap one and it hops and shares an idea, spoken aloud. An
// idea about a place is a button that takes you there. Calm motion: slower, no hop.
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import { critters, ideas, type CritterDef } from '../content/critters';
import { findBuilding, type BuildingKind } from '../content/rooms';
import type { IconName } from '../design/icons';
import { pictureUrl } from '../design/thingPicture';
import { buildingName, strings } from '../i18n';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { useShowTextLabels } from '../ui/labels';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { useCalmMotion } from './media';

const BUBBLE_MS = 5000;

const PLACE_ICON: Record<BuildingKind, IconName> = {
  house: 'house',
  cafe: 'shop',
  park: 'tree',
  library: 'book',
  musicHall: 'note',
};

function randomIn(z: CritterDef['zone']): { x: number; y: number } {
  return { x: z.x0 + Math.random() * (z.x1 - z.x0), y: z.y0 + Math.random() * (z.y1 - z.y0) };
}

function Critter({ def }: { def: CritterDef }) {
  const calm = useCalmMotion();
  const words = useShowTextLabels();
  const [start] = useState(() => randomIn(def.zone));
  const [at, setAt] = useState(start);
  const [move, setMove] = useState({ ms: 0, left: false });
  const [idea, setIdea] = useState<(typeof ideas)[number] | null>(null);
  const [hop, setHop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const name = strings.critters.names[def.id] ?? def.id;
  const voice = useVoiceLabel(strings.critters.tap(name));

  // Stroll: a new spot every few seconds (slower with calm motion).
  useEffect(() => {
    let alive = true;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const step = (from: { x: number; y: number }) => {
      const to = randomIn(def.zone);
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const ms = Math.max(800, dist * def.pace * 1000 * (calm ? 2 : 1));
      setMove({ ms, left: to.x < from.x });
      setAt(to);
      wait = setTimeout(() => alive && step(to), ms + 1500 + Math.random() * 3000);
    };
    wait = setTimeout(() => step(start), 500 + Math.random() * 2000);
    return () => {
      alive = false;
      clearTimeout(wait);
    };
  }, [def, calm, start]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const think = () => {
    const next = ideas[Math.floor(Math.random() * ideas.length)] ?? null;
    if (!next) return;
    playSfx('chime');
    setHop((h) => h + 1);
    setIdea(next);
    speak(strings.critters.ideas[next.key] ?? '');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIdea(null), BUBBLE_MS);
  };

  const place = idea?.place ? findBuilding(idea.place) : undefined;
  const text = idea ? (strings.critters.ideas[idea.key] ?? '') : '';
  return (
    <div
      className="critter"
      data-id={def.id}
      style={{
        left: `${at.x * 100}%`,
        top: `${at.y * 100}%`,
        transitionDuration: `${move.ms}ms`,
      }}
    >
      <button
        type="button"
        className="critter__body"
        aria-label={strings.critters.tap(name)}
        {...voice}
        onClick={think}
      >
        <img
          key={hop}
          className="critter__picture"
          data-hop={hop > 0 || undefined}
          data-left={move.left || undefined}
          src={pictureUrl(def.art)}
          alt=""
          width={def.size}
          height={def.size}
          draggable={false}
        />
      </button>
      {idea &&
        (place ? (
          <button
            type="button"
            className="critter__bubble critter__bubble--go"
            aria-label={`${text} ${strings.critters.go(buildingName(place.id))}`}
            onClick={() => {
              playSfx('tap');
              const room = place.rooms[0];
              if (room) useUi.getState().setRoom(room.id);
              useUi.getState().go('scene');
            }}
          >
            {words ? text : <Icon name={PLACE_ICON[place.kind]} size={28} />}
          </button>
        ) : (
          <span className="critter__bubble" role="status">
            {words ? text : <Icon name="sparkle" size={28} />}
          </span>
        ))}
    </div>
  );
}

export function MapCritters() {
  return (
    <div className="world-map__critters">
      {critters.map((c) => (
        <Critter key={c.id} def={c} />
      ))}
    </div>
  );
}
