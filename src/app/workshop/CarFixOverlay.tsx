// The car-fixing game, over the garage: the car with a few broken spots that
// wobble, and a tray of tools. Tap a tool (it lifts on a marigold halo and the
// spots glow), then tap a spot; or drag a tool onto a spot; or Tab and Enter.
// The right tool mends it with a sparkle; the wrong one just goes "boing". When
// everything is mended the car honks, drives a little loop and stays shiny in the
// garage for a game day (an undoable change, like everything the child does).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { pictureUrl } from '../../design/thingPicture';
import { strings } from '../../i18n';
import { dayNumber } from '../../sim/clock';
import { carIsShiny } from '../../sim/workbench';
import { usePlay } from '../../state/play';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { game } from '../game';
import {
  CAR_SPOTS,
  CAR_TOOLS,
  allFixed,
  applyTool,
  breakdown,
  spotAt,
  toolArt,
  type CarFixState,
  type CarSpot,
  type CarTool,
} from './carFix';
import './workshop.css';

const DRAG_START_PX = 8;

function seedFor(key: string, minute: number): number {
  let h = dayNumber(minute);
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
  return h;
}

/** The car, side on, nose to the left; broken parts drawn as they are now. */
function CarPicture({ broken }: { broken: ReadonlySet<CarSpot> }) {
  const ink = '#2A1640';
  return (
    <svg viewBox="0 0 760 400" aria-hidden="true">
      <ellipse cx="380" cy="378" rx="340" ry="16" fill={ink} opacity="0.12" />
      {/* Cabin and windows */}
      <path
        d="M200 175 L250 70 Q258 52 280 52 L500 52 Q522 52 532 70 L580 175 Z"
        fill="#EF4B2F"
        stroke={ink}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M232 168 L268 84 Q272 76 282 76 L372 76 L372 168 Z"
        fill="#BFE3FF"
        stroke={ink}
        strokeWidth="5"
      />
      <path
        d="M392 168 L392 76 L494 76 Q504 76 508 84 L546 168 Z"
        fill="#BFE3FF"
        stroke={ink}
        strokeWidth="5"
      />
      {broken.has('window') ? (
        <g fill="#8B5A35" opacity="0.85">
          <circle cx="292" cy="118" r="16" />
          <circle cx="320" cy="140" r="11" />
          <circle cx="338" cy="104" r="9" />
          <circle cx="270" cy="148" r="7" />
        </g>
      ) : (
        <path
          d="M290 92 L272 140 M312 92 L296 132"
          stroke="#fff"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.8"
        />
      )}
      {/* Body */}
      <rect
        x="36"
        y="168"
        width="690"
        height="130"
        rx="54"
        fill="#EF4B2F"
        stroke={ink}
        strokeWidth="8"
      />
      <rect x="70" y="186" width="300" height="12" rx="6" fill="#fff" opacity="0.4" />
      <line x1="380" y1="176" x2="380" y2="290" stroke={ink} strokeWidth="5" opacity="0.5" />
      <rect x="320" y="206" width="40" height="10" rx="5" fill={ink} />
      {broken.has('dent') && (
        <g>
          <path
            d="M392 214 Q430 250 392 280 Q420 248 392 214 Z"
            fill="#B8321C"
            stroke={ink}
            strokeWidth="4"
          />
          <path
            d="M402 230 L418 244 M404 258 L420 250"
            stroke={ink}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
      {/* Headlight, rear light */}
      <ellipse cx="62" cy="210" rx="18" ry="16" fill="#FFB627" stroke={ink} strokeWidth="5" />
      <rect
        x="706"
        y="198"
        width="18"
        height="30"
        rx="8"
        fill="#FF8FB1"
        stroke={ink}
        strokeWidth="5"
      />
      {/* Fuel cap and exhaust */}
      <circle
        cx="672"
        cy="200"
        r="16"
        fill={broken.has('fuel') ? '#fff' : '#C9CED9'}
        stroke={ink}
        strokeWidth="5"
      />
      {broken.has('fuel') && (
        <g fill="#9AA3B5" stroke={ink} strokeWidth="3">
          <circle cx="742" cy="262" r="14" />
          <circle cx="752" cy="236" r="10" />
          <circle cx="740" cy="214" r="7" />
        </g>
      )}
      <rect
        x="714"
        y="270"
        width="40"
        height="14"
        rx="7"
        fill="#9AA3B5"
        stroke={ink}
        strokeWidth="4"
      />
      {/* Bumper and its bolt */}
      <rect
        x="20"
        y="252"
        width="110"
        height="30"
        rx="15"
        fill="#C9CED9"
        stroke={ink}
        strokeWidth="5"
      />
      {broken.has('bolt') ? (
        <g transform="rotate(-28 80 238)">
          <rect
            x="72"
            y="214"
            width="16"
            height="30"
            rx="4"
            fill="#9AA3B5"
            stroke={ink}
            strokeWidth="4"
          />
          <rect
            x="64"
            y="208"
            width="32"
            height="12"
            rx="4"
            fill="#9AA3B5"
            stroke={ink}
            strokeWidth="4"
          />
        </g>
      ) : (
        <circle cx="80" cy="266" r="8" fill="#9AA3B5" stroke={ink} strokeWidth="4" />
      )}
      {/* Wheels */}
      <circle cx="190" cy="312" r="62" fill={ink} />
      <circle cx="190" cy="312" r="26" fill="#C9CED9" />
      {broken.has('tyre') ? (
        <g>
          <ellipse cx="560" cy="330" rx="70" ry="44" fill={ink} />
          <ellipse cx="560" cy="326" rx="26" ry="20" fill="#C9CED9" />
        </g>
      ) : (
        <g>
          <circle cx="560" cy="312" r="62" fill={ink} />
          <circle cx="560" cy="312" r="26" fill="#C9CED9" />
        </g>
      )}
    </svg>
  );
}

function ToolButton({
  tool,
  held,
  onTap,
  onDrop,
}: {
  tool: CarTool;
  held: boolean;
  onTap: () => void;
  onDrop: (spot: CarSpot | null, x: number, y: number) => void;
}) {
  const label = strings.workshop.carTools[tool];
  const voice = useVoiceLabel(label);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  return (
    <>
      <button
        type="button"
        className="car-fix__tool"
        aria-label={label}
        aria-pressed={held}
        data-tool={tool}
        {...voice}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
          voice.onPointerDown(e);
          start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          dragged.current = false;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Synthetic events cannot be captured; taps still work.
          }
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s || s.id !== e.pointerId) return;
          if (!dragged.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_START_PX) {
            dragged.current = true;
            playSfx('pick');
          }
          if (dragged.current) setDrag({ x: e.clientX, y: e.clientY });
        }}
        onPointerUp={(e) => {
          voice.onPointerUp();
          start.current = null;
          if (!dragged.current) return;
          setDrag(null);
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const spot = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-spot]') : null;
          const id = spot?.dataset.spot;
          onDrop(isSpot(id) ? id : null, e.clientX, e.clientY);
        }}
        onPointerCancel={() => {
          start.current = null;
          dragged.current = false;
          setDrag(null);
        }}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onTap();
        }}
      >
        <img src={pictureUrl(toolArt[tool])} alt="" draggable={false} />
      </button>
      {drag && (
        <img
          className="car-fix__ghost"
          src={pictureUrl(toolArt[tool])}
          alt=""
          aria-hidden="true"
          style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
        />
      )}
    </>
  );
}

function spotLabel(spot: CarSpot, fixed: boolean, held: CarTool | null): string {
  const name = strings.workshop.spots[spot];
  if (fixed) return strings.workshop.fixed(name);
  if (held) return strings.workshop.useOn(strings.workshop.carTools[held], name);
  return name;
}

const isSpot = (v: string | undefined): v is CarSpot =>
  v !== undefined && (CAR_SPOTS as readonly string[]).includes(v);

const close = () => usePlay.getState().setCarFix(null);

function SpotButton({
  spot,
  fixed,
  held,
  wrong,
  onUse,
}: {
  spot: CarSpot;
  fixed: boolean;
  held: CarTool | null;
  wrong: number;
  onUse: () => void;
}) {
  const label = spotLabel(spot, fixed, held);
  const voice = useVoiceLabel(label);
  const at = spotAt[spot];
  return (
    <button
      type="button"
      className="car-fix__spot"
      data-spot={spot}
      data-fixed={fixed || undefined}
      // Two names for the same "boing", so each wrong try plays it again.
      data-wrong={wrong === 0 ? undefined : wrong % 2 === 0 ? 'b' : 'a'}
      aria-label={label}
      style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%` }}
      {...voice}
      onClick={onUse}
    >
      {fixed && <Icon name="check" size={34} strokeWidth={3} />}
    </button>
  );
}

function CarFixGame({ carKey }: { carKey: string }) {
  const shinyAtStart = useMemo(() => carIsShiny(game.world, carKey), [carKey]);
  const [state, setState] = useState<CarFixState>(() =>
    shinyAtStart ? { broken: [], fixed: [] } : breakdown(seedFor(carKey, game.world.minute)),
  );
  const [held, setHeld] = useState<CarTool | null>(null);
  const [wrong, setWrong] = useState<Partial<Record<CarSpot, number>>>({});
  const [done, setDone] = useState(shinyAtStart);
  const labels = useShowTextLabels();
  const doneRef = useRef<HTMLSpanElement>(null);

  const mend = (spot: CarSpot, tool: CarTool | null) => {
    if (!tool) {
      // No tool in hand yet: the tray gives a little nudge.
      playSfx('soft');
      document.querySelector<HTMLElement>('.car-fix__tool')?.focus();
      return;
    }
    const { state: next, result } = applyTool(state, spot, tool);
    if (result === 'wrong') {
      playSfx('boing');
      setWrong((w) => ({ ...w, [spot]: (w[spot] ?? 0) + 1 }));
      return;
    }
    if (result !== 'fixed') return;
    playSfx('craft');
    setState(next);
    if (allFixed(next)) {
      setHeld(null);
      setDone(true);
      game.do({ type: 'fixCar', key: carKey });
      window.setTimeout(() => playSfx('honk'), 350);
    }
  };

  // Escape puts the tool down, then closes; play shortcuts (map, decorate, camera...)
  // wait until the game is closed. Caught before the play screen's own handler.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        if (held) setHeld(null);
        else close();
        return;
      }
      if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== ' ') e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [held]);

  // The play screen behind waits (no focus or taps there) until the game closes.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const others = [...(root?.parentElement?.children ?? [])].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== root && !el.inert,
    );
    for (const el of others) el.inert = true;
    root?.querySelector<HTMLElement>('.car-fix__tool')?.focus();
    return () => {
      for (const el of others) el.inert = false;
    };
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.querySelector('button')?.focus();
  }, [done]);

  const brokenNow = new Set(state.broken.filter((s) => !state.fixed.includes(s)));

  return (
    <div
      ref={rootRef}
      className="car-fix"
      role="dialog"
      aria-modal="true"
      aria-label={strings.workshop.fixCar}
      data-holding={held ? '' : undefined}
      data-done={done && !shinyAtStart ? '' : undefined}
    >
      <div className="car-fix__top">
        <IconButton icon="back" label={strings.workshop.close} onClick={close} />
        {labels && <h2 className="car-fix__title">{strings.workshop.fixCar}</h2>}
        {state.broken.length > 0 && (
          <div className="car-fix__ticks" aria-hidden="true">
            {state.broken.map((s) => (
              <span
                key={s}
                className="car-fix__tick"
                data-done={state.fixed.includes(s) || undefined}
              >
                <Icon name="check" size={18} strokeWidth={3.4} />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="car-fix__garage">
        <div className="car-fix__car">
          <CarPicture broken={brokenNow} />
          {CAR_SPOTS.filter((s) => state.broken.includes(s) && !done).map((s) => (
            <SpotButton
              key={s}
              spot={s}
              fixed={state.fixed.includes(s)}
              held={held}
              wrong={wrong[s] ?? 0}
              onUse={() => mend(s, held)}
            />
          ))}
          {done && (
            <div className="car-fix__sparkles" aria-hidden="true">
              {[
                [12, 14],
                [48, 4],
                [86, 18],
                [30, 50],
                [70, 46],
              ].map(([x, y], i) => (
                <span key={i} style={{ left: `${x}%`, top: `${y}%`, ['--i' as string]: i }}>
                  <Icon name="sparkle" size={34} />
                </span>
              ))}
            </div>
          )}
        </div>
        {done && (
          <span ref={doneRef} className="car-fix__done">
            <IconButton
              icon="check"
              label={strings.workshop.allFixed}
              sound="confirm"
              onClick={close}
            />
          </span>
        )}
      </div>

      <div className="car-fix__tray" role="group" aria-label={strings.workshop.tools}>
        {CAR_TOOLS.map((t) => (
          <ToolButton
            key={t}
            tool={t}
            held={held === t}
            onTap={() => {
              playSfx(held === t ? 'soft' : 'pick');
              setHeld(held === t ? null : t);
            }}
            onDrop={(spot) => {
              if (spot) mend(spot, t);
              else playSfx('soft');
            }}
          />
        ))}
      </div>
      <span className="visually-hidden" aria-live="polite">
        {done ? strings.workshop.carFixed : ''}
      </span>
    </div>
  );
}

/** Open while the child is fixing a car (usePlay.carFix). */
export function CarFixOverlay() {
  const carKey = usePlay((s) => s.carFix);
  // Leaving the play screen closes it.
  useEffect(() => () => usePlay.getState().setCarFix(null), []);
  if (!carKey) return null;
  return <CarFixGame key={carKey} carKey={carKey} />;
}
