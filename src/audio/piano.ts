// The hidden piano in the grown-up area: a few instruments built live with Web Audio
// (oscillators and envelopes), so there are no sound files to license or download.
import { ZZFX } from 'zzfx';
import { useSettings } from '../state/settings';

export const INSTRUMENTS = [
  'grand',
  'electric',
  'toy',
  'organ',
  'musicBox',
  'harpsichord',
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

interface Voice {
  stop: () => void;
}

/** Equal temperament: MIDI note number to frequency. */
export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

const PEAK = 0.32;

/** A note's partials and envelope for each instrument. */
const RECIPES: Record<
  Instrument,
  {
    partials: { ratio: number; gain: number; type?: OscillatorType; decay?: number }[];
    attack: number;
    /** Seconds for the sound to fade by itself (Infinity: holds while pressed). */
    decay: number;
    /** Seconds to fade once the key is let go. */
    release: number;
    /** Optional low-pass filter cut-off, as a multiple of the note's frequency. */
    filter?: number;
  }
> = {
  grand: {
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.45, decay: 1.2 },
      { ratio: 3, gain: 0.2, decay: 0.7 },
      { ratio: 4.01, gain: 0.1, decay: 0.4 },
    ],
    attack: 0.004,
    decay: 3,
    release: 0.35,
  },
  electric: {
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 1.002, gain: 0.5 },
      { ratio: 7.01, gain: 0.12, decay: 0.15 },
    ],
    attack: 0.006,
    decay: 2.4,
    release: 0.3,
  },
  toy: {
    partials: [
      { ratio: 1, gain: 0.7, type: 'triangle' },
      { ratio: 3.9, gain: 0.5, decay: 0.25 },
      { ratio: 9.2, gain: 0.15, decay: 0.08 },
    ],
    attack: 0.002,
    decay: 0.9,
    release: 0.6,
  },
  organ: {
    partials: [
      { ratio: 0.5, gain: 0.5 },
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.6 },
      { ratio: 3, gain: 0.35 },
      { ratio: 4, gain: 0.25 },
    ],
    attack: 0.02,
    decay: Infinity,
    release: 0.08,
  },
  musicBox: {
    partials: [
      { ratio: 2, gain: 1 },
      { ratio: 4, gain: 0.25, decay: 0.3 },
      { ratio: 6.3, gain: 0.12, decay: 0.15 },
    ],
    attack: 0.002,
    decay: 1.4,
    release: 1.2,
  },
  harpsichord: {
    partials: [
      { ratio: 1, gain: 0.6, type: 'sawtooth' },
      { ratio: 2, gain: 0.25, type: 'square', decay: 0.5 },
    ],
    attack: 0.002,
    decay: 1.1,
    release: 0.15,
    filter: 6,
  },
};

function context(): AudioContext {
  return ZZFX.audioContext;
}

/** Start a note; call `stop` when the key is let go. Never throws. */
export function startNote(instrument: Instrument, midi: number): Voice {
  const volume = useSettings.getState().effectsVolume;
  const silent: Voice = { stop: () => {} };
  if (volume <= 0) return silent;
  try {
    const ctx = context();
    if (ctx.state !== 'running') void ctx.resume();
    const r = RECIPES[instrument];
    const f = frequency(midi);
    const now = ctx.currentTime;
    const out = ctx.createGain();
    // Higher notes a little quieter, so chords stay balanced.
    const peak = PEAK * volume * Math.min(1, 523 / f + 0.35);
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(peak, now + r.attack);
    if (Number.isFinite(r.decay)) out.gain.setTargetAtTime(0, now + r.attack, r.decay / 4);
    let last: AudioNode = out;
    if (r.filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(16000, f * r.filter), now);
      lp.frequency.setTargetAtTime(f * 2, now, 0.3);
      out.connect(lp);
      last = lp;
    }
    last.connect(ctx.destination);
    const oscs: OscillatorNode[] = [];
    const total = r.partials.reduce((sum, p) => sum + p.gain, 0);
    for (const p of r.partials) {
      if (f * p.ratio > 18000) continue;
      const osc = ctx.createOscillator();
      osc.type = p.type ?? 'sine';
      osc.frequency.setValueAtTime(f * p.ratio, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(p.gain / total, now);
      if (p.decay) g.gain.setTargetAtTime(0, now, p.decay / 4);
      osc.connect(g).connect(out);
      osc.start(now);
      oscs.push(osc);
    }
    const end = Number.isFinite(r.decay) ? now + r.attack + r.decay * 1.5 : null;
    if (end !== null) for (const o of oscs) o.stop(end);
    let stopped = false;
    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
        out.gain.setTargetAtTime(0, t, r.release / 4);
        const off = t + r.release * 1.5;
        for (const o of oscs) {
          try {
            o.stop(end === null ? off : Math.min(end, off));
          } catch {
            // Already stopped.
          }
        }
      },
    };
  } catch {
    return silent;
  }
}
