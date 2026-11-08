import { useEffect, useState, type PointerEvent } from 'react';
import { INSTRUMENTS, startNote, type Instrument } from '../../audio/piano';
import { playSfx } from '../../audio/audio';
import { strings } from '../../i18n';
import { useViewportWidth } from '../media';
import { ScreenFrame } from './ScreenFrame';

const C4 = 60;
/** Semitones above C for the white keys of one octave. */
const WHITE = [0, 2, 4, 5, 7, 9, 11];
/** White keys (by position in the octave) that have a black key after them. */
const HAS_BLACK = new Set([0, 1, 3, 4, 5]);
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** Computer keys, laid out like a piano: the home row is white, the row above black. */
const COMPUTER_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k'];
const STORE_KEY = 'pocket-town:piano';

function noteName(midi: number): string {
  return `${NAMES[midi % 12] ?? ''}${Math.floor(midi / 12) - 1}`;
}

function savedInstrument(): Instrument {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return INSTRUMENTS.find((i) => i === v) ?? 'grand';
  } catch {
    return 'grand';
  }
}

interface Key {
  midi: number;
  black: boolean;
  /** Left edge and width, in % of the keyboard. */
  left: number;
  width: number;
}

function layout(whiteCount: number): Key[] {
  const w = 100 / whiteCount;
  const keys: Key[] = [];
  for (let i = 0; i < whiteCount; i++) {
    const octave = Math.floor(i / 7);
    const pos = i % 7;
    const midi = C4 + octave * 12 + (WHITE[pos] ?? 0);
    keys.push({ midi, black: false, left: i * w, width: w });
    if (HAS_BLACK.has(pos) && i < whiteCount - 1) {
      keys.push({ midi: midi + 1, black: true, left: (i + 1) * w - w * 0.32, width: w * 0.64 });
    }
  }
  return keys;
}

/** The key under a finger or pointer, if any. */
function keyAt(e: PointerEvent): number | null {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const k = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-midi]') : null;
  return k ? Number(k.dataset.midi) : null;
}

/** Which notes are sounding, by finger, pointer or key. Lives outside React renders. */
class Player {
  private readonly voices = new Map<string, { midi: number; stop: () => void }>();
  private onChange: (held: ReadonlySet<number>) => void = () => {};
  private instrument: Instrument;

  constructor(instrument: Instrument) {
    this.instrument = instrument;
  }

  /** Notes pressed from now on use this sound. */
  use(instrument: Instrument): void {
    this.instrument = instrument;
  }

  listen(onChange: (held: ReadonlySet<number>) => void): void {
    this.onChange = onChange;
  }

  noteOf(id: string): number | undefined {
    return this.voices.get(id)?.midi;
  }

  press(id: string, midi: number): void {
    this.voices.get(id)?.stop();
    this.voices.set(id, { midi, ...startNote(this.instrument, midi) });
    this.changed();
  }

  release(id: string): void {
    const v = this.voices.get(id);
    if (!v) return;
    v.stop();
    this.voices.delete(id);
    this.changed();
  }

  releaseAll(): void {
    for (const v of this.voices.values()) v.stop();
    this.voices.clear();
    this.changed();
  }

  private changed(): void {
    this.onChange(new Set([...this.voices.values()].map((v) => v.midi)));
  }
}

/** The hidden piano: tap, slide or press keys; choose how it sounds. */
export function PianoScreen() {
  const width = useViewportWidth();
  // Every white key stays at least 44 px wide: one octave (seven keys, or eight
  // from C to C when there is room) on phones, two octaves on wider screens.
  const whiteCount = width < 420 ? 7 : width < 600 ? 8 : 15;
  const keys = layout(whiteCount);
  const [instrument, setInstrument] = useState<Instrument>(savedInstrument);
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set());

  const [player] = useState(() => new Player(instrument));

  // Letter keys play too (desktop). Leaving the screen or the app lets every note go.
  useEffect(() => {
    player.listen(setHeld);
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = COMPUTER_KEYS.indexOf(e.key.toLowerCase());
      if (i < 0) return;
      e.preventDefault();
      player.press(`key:${e.key.toLowerCase()}`, C4 + i);
    };
    const up = (e: KeyboardEvent) => player.release(`key:${e.key.toLowerCase()}`);
    const all = () => player.releaseAll();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', all);
    document.addEventListener('visibilitychange', all);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', all);
      document.removeEventListener('visibilitychange', all);
      player.releaseAll();
    };
  }, [player]);

  const choose = (i: Instrument) => {
    playSfx('tap');
    setInstrument(i);
    player.use(i);
    try {
      localStorage.setItem(STORE_KEY, i);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  };

  return (
    <ScreenFrame title={strings.screens.piano} className="screen--piano">
      <div className="piano">
        <div className="piano__sounds" role="group" aria-label={strings.piano.instrument}>
          {INSTRUMENTS.map((i) => (
            <button
              key={i}
              type="button"
              className="language-choice"
              aria-pressed={instrument === i}
              onClick={() => choose(i)}
            >
              {strings.piano.instruments[i]}
            </button>
          ))}
        </div>
        <div
          className="piano__keys"
          role="group"
          aria-label={strings.piano.keys}
          onPointerDown={(e) => {
            const midi = keyAt(e);
            if (midi === null) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            player.press(`p:${e.pointerId}`, midi);
          }}
          onPointerMove={(e) => {
            const id = `p:${e.pointerId}`;
            const now = player.noteOf(id);
            if (now === undefined) return;
            const midi = keyAt(e);
            if (midi !== null && midi !== now) player.press(id, midi);
          }}
          onPointerUp={(e) => player.release(`p:${e.pointerId}`)}
          onPointerCancel={(e) => player.release(`p:${e.pointerId}`)}
          onLostPointerCapture={(e) => player.release(`p:${e.pointerId}`)}
        >
          <div className="piano__bed">
            {keys.map((k) => (
              <button
                key={k.midi}
                type="button"
                className={k.black ? 'piano__key piano__key--black' : 'piano__key'}
                data-midi={k.midi}
                data-down={held.has(k.midi) || undefined}
                style={{ left: `${k.left}%`, width: `${k.width}%` }}
                aria-label={noteName(k.midi)}
                onClick={(e) => {
                  // Pointers are handled above; this is Enter or Space on a focused key.
                  if (e.detail !== 0) return;
                  player.press('enter', k.midi);
                  setTimeout(() => player.release('enter'), 400);
                }}
              >
                {!k.black && k.midi % 12 === 0 && (
                  <span className="piano__c" aria-hidden="true">
                    {noteName(k.midi)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <p className="grown-up__note">{strings.piano.note}</p>
      </div>
    </ScreenFrame>
  );
}
