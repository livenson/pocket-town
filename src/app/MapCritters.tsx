// Animals wandering the world map (a play-tester asked for some). Each strolls
// about its own patch; tap one and it hops and says what it thinks, spoken aloud
// with a picture for children who don't read. Each kind has its own personality
// (src/content/critterThoughts.ts); some thoughts are about what is happening in
// the town, some are riddles (tap to hear the answer), some are little tricks. A
// thought about a place is a button that takes you there. Calm motion: slower,
// no hop and no tricks acted out.
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../audio/audio';
import { speak } from '../audio/speech';
import type { Thought } from '../content/critterThoughts';
import { critters, type CritterDef, type CritterId } from '../content/critters';
import { findBuilding, buildingIcon } from '../content/rooms';
import { pictureUrl } from '../design/thingPicture';
import { buildingName, strings } from '../i18n';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { useShowTextLabels } from '../ui/labels';
import { useVoiceLabel } from '../ui/useVoiceLabel';
import { nextThought, readTown, type Deck } from './critterMind';
import { game } from './game';
import { mapPlaneNow } from './mapPlane';
import { useCalmMotion } from './media';

/** Each animal's deck lasts while the app is open, so leaving the map doesn't reset it. */
const decks = new Map<CritterId, Deck>();

/** One animal talks at a time (the voice moves on too): each one's way to stop. */
const hush = new Map<CritterId, () => void>();

/** Long enough to hear it: longer thoughts stay longer; riddles wait for the answer. */
function bubbleMs(text: string, riddle: boolean): number {
  if (riddle) return 15000;
  return Math.min(11000, Math.max(5000, 2500 + text.length * 60));
}

function thoughtText(t: Thought, name: string): string {
  const words = strings.critters.thoughts[t.key];
  return typeof words === 'function' ? words(name) : words;
}

function randomIn(z: CritterDef['zone']): { x: number; y: number } {
  return { x: z.x0 + Math.random() * (z.x1 - z.x0), y: z.y0 + Math.random() * (z.y1 - z.y0) };
}

/** Half a bubble's width: closer than this to the edge of the view, it leans inwards. */
const HALF_BUBBLE = 125;

/** Which way the bubble leans so it stays in view (the map scrolls on a phone). */
function bubbleSide(el: HTMLElement | null): 'left' | 'right' | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  const view = el.closest('.world-map__scroll')?.getBoundingClientRect() ?? {
    left: 0,
    right: window.innerWidth,
  };
  const x = r.left + r.width / 2;
  if (x - view.left < HALF_BUBBLE) return 'left';
  if (view.right - x < HALF_BUBBLE) return 'right';
  return undefined;
}

interface Said {
  thought: Thought;
  text: string;
  side: 'left' | 'right' | undefined;
  /** Counts up, so the same trick can play again. */
  n: number;
  revealed: boolean;
}

function Critter({ def }: { def: CritterDef }) {
  const calm = useCalmMotion();
  const words = useShowTextLabels();
  const [start] = useState(() => randomIn(def.zone));
  const [at, setAt] = useState(start);
  const [move, setMove] = useState({ ms: 0, left: false });
  const [said, setSaid] = useState<Said | null>(null);
  const [hop, setHop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const self = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    hush.set(def.id, () => {
      clearTimeout(timer.current);
      setSaid(null);
    });
    return () => {
      hush.delete(def.id);
      clearTimeout(timer.current);
    };
  }, [def.id]);

  const hideIn = (ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(null), ms);
  };

  const think = () => {
    for (const [id, stop] of hush) if (id !== def.id) stop();
    const town = readTown(game.world, mapPlaneNow.flying, Math.random);
    const pick = nextThought(def.id, decks.get(def.id), town, Math.random);
    decks.set(def.id, pick.deck);
    const { thought } = pick;
    const text = thoughtText(thought, pick.name);
    playSfx(thought.trick ? 'jingle' : 'chime');
    setHop((h) => h + 1);
    const side = bubbleSide(self.current);
    setSaid((s) => ({ thought, text, side, n: (s?.n ?? 0) + 1, revealed: false }));
    speak(text);
    hideIn(bubbleMs(text, thought.answer !== undefined));
  };

  const reveal = () => {
    const answer = said?.thought.answer;
    if (!said || !answer) return;
    const text = strings.critters.answers[answer.key];
    playSfx('confirm');
    setSaid({ ...said, revealed: true });
    speak(text);
    hideIn(bubbleMs(`${said.text} ${text}`, false));
  };

  const thought = said?.thought;
  const place = thought?.place ? findBuilding(thought.place) : undefined;
  const trick = thought?.trick && !calm ? thought.trick : undefined;
  // Keep the bubble in view: near an edge it leans inwards, and up at the top it
  // hangs below the animal, clear of the map's buttons.
  const side = said?.side;
  const below = at.y < 0.2 || undefined;
  const picture = thought && (
    <img
      className="critter__thought-picture"
      src={pictureUrl(thought.pic)}
      alt=""
      width={36}
      height={36}
      draggable={false}
    />
  );
  return (
    <div
      ref={self}
      className="critter"
      data-id={def.id}
      data-talking={said ? true : undefined}
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
          key={`${hop}-${trick ?? ''}`}
          className="critter__picture"
          data-hop={(hop > 0 && !trick) || undefined}
          data-trick={trick}
          data-left={move.left || undefined}
          src={pictureUrl(def.art)}
          alt=""
          width={def.size}
          height={def.size}
          draggable={false}
        />
        {trick === 'juggle' && thought?.props && (
          <span key={said?.n} className="critter__juggle" aria-hidden="true">
            {thought.props.map((p, i) => (
              <img
                key={i}
                src={pictureUrl(p)}
                alt=""
                width={20}
                height={20}
                draggable={false}
                style={{ animationDelay: `${i * -0.33}s` }}
              />
            ))}
          </span>
        )}
      </button>
      {said &&
        thought &&
        (place ? (
          <button
            type="button"
            className="critter__bubble critter__bubble--go"
            data-side={side}
            data-below={below}
            aria-label={`${said.text} ${strings.critters.go(buildingName(place.id))}`}
            onClick={() => {
              playSfx('tap');
              const room = place.rooms[0];
              if (room) useUi.getState().setRoom(room.id);
              useUi.getState().go('scene');
            }}
          >
            {picture}
            {words && <span className="critter__text">{said.text}</span>}
            <span className="critter__go" aria-hidden="true">
              <Icon name={buildingIcon[place.kind]} size={24} />
            </span>
          </button>
        ) : (
          <span
            className="critter__bubble"
            data-side={side}
            data-below={below}
            data-kind={thought.kind}
            role="status"
          >
            <span className="visually-hidden">{said.text}</span>
            {picture}
            {words && (
              <span className="critter__text" aria-hidden="true">
                {said.text}
              </span>
            )}
            {thought.answer &&
              (said.revealed ? (
                <span className="critter__answer">
                  <img
                    className="critter__thought-picture"
                    src={pictureUrl(thought.answer.pic)}
                    alt=""
                    width={36}
                    height={36}
                    draggable={false}
                  />
                  {words ? (
                    <span className="critter__text">
                      {strings.critters.answers[thought.answer.key]}
                    </span>
                  ) : (
                    <span className="visually-hidden">
                      {strings.critters.answers[thought.answer.key]}
                    </span>
                  )}
                </span>
              ) : (
                <RevealButton onClick={reveal} />
              ))}
          </span>
        ))}
    </div>
  );
}

function RevealButton({ onClick }: { onClick: () => void }) {
  const voice = useVoiceLabel(strings.critters.reveal);
  return (
    <button
      type="button"
      className="critter__reveal"
      aria-label={strings.critters.reveal}
      {...voice}
      onClick={onClick}
    >
      <Icon name="eye" size={24} />
    </button>
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
