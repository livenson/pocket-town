// Procedural sound effects (ZzFX). Every sound is a set of synth parameters; no
// audio files. Sounds can be designed by ear with the ZzFX sound designer, then
// written here with named parameters.
import type { ZzfxParams } from 'zzfx';

/** ZzFX parameters in the order the synth expects them. */
const PARAM_ORDER = [
  'volume',
  'randomness',
  'frequency',
  'attack',
  'sustain',
  'release',
  'shape',
  'shapeCurve',
  'slide',
  'deltaSlide',
  'pitchJump',
  'pitchJumpTime',
  'repeatTime',
  'noise',
  'modulation',
  'bitCrush',
  'delay',
  'sustainVolume',
  'decay',
  'tremolo',
  'filter',
] as const;

export type SfxParam = (typeof PARAM_ORDER)[number];

/** Build a positional ZzFX parameter list from named values (unset = ZzFX default). */
export function zzfxParams(named: Partial<Record<SfxParam, number>>): ZzfxParams {
  const params = PARAM_ORDER.map((key) => named[key]);
  while (params.length > 0 && params[params.length - 1] === undefined) params.pop();
  return params;
}

export const sfx = {
  /** Short, round, rising "pop": the basic tap sound. */
  tap: zzfxParams({
    volume: 1.4,
    randomness: 0.05,
    frequency: 330,
    attack: 0,
    sustain: 0.02,
    release: 0.09,
    shape: 0, // sine
    shapeCurve: 1.8,
    slide: 26,
    sustainVolume: 0.6,
    decay: 0.03,
  }),
  /** Wooden rattle for the "surprise me" dice. */
  dice: zzfxParams({
    volume: 1,
    randomness: 0.1,
    frequency: 180,
    attack: 0,
    sustain: 0.05,
    release: 0.12,
    shape: 3, // noise-ish square
    shapeCurve: 0.5,
    repeatTime: 0.04,
    noise: 0.4,
    sustainVolume: 0.5,
  }),
  /** Bright two-step chime: a hold-to-confirm finished, or something was done. */
  confirm: zzfxParams({
    volume: 1,
    randomness: 0.02,
    frequency: 520,
    attack: 0.01,
    sustain: 0.06,
    release: 0.18,
    shape: 0,
    shapeCurve: 1.5,
    pitchJump: 260,
    pitchJumpTime: 0.07,
    sustainVolume: 0.7,
  }),
  /** Soft low blip: a sheet or overlay closes, a hold was let go early. */
  soft: zzfxParams({
    volume: 0.7,
    randomness: 0.03,
    frequency: 220,
    attack: 0,
    sustain: 0.02,
    release: 0.08,
    shape: 0,
    slide: -6,
  }),
  /** Lift: a thing is picked up. */
  pick: zzfxParams({
    volume: 0.8,
    randomness: 0.05,
    frequency: 420,
    attack: 0,
    sustain: 0.03,
    release: 0.08,
    shape: 0,
    slide: 18,
    sustainVolume: 0.6,
  }),
  /** Thunk: a thing is put down. */
  place: zzfxParams({
    volume: 1,
    randomness: 0.05,
    frequency: 200,
    attack: 0,
    sustain: 0.02,
    release: 0.12,
    shape: 0,
    shapeCurve: 2,
    slide: -12,
    sustainVolume: 0.7,
  }),
  /** Gentle "no": a drop that does not fit (never harsh). */
  invalid: zzfxParams({
    volume: 0.6,
    randomness: 0,
    frequency: 240,
    attack: 0.01,
    sustain: 0.05,
    release: 0.12,
    shape: 1,
    pitchJump: -60,
    pitchJumpTime: 0.06,
    sustainVolume: 0.6,
  }),
  /** Munch: eating. */
  eat: zzfxParams({
    volume: 0.7,
    randomness: 0.2,
    frequency: 150,
    attack: 0,
    sustain: 0.02,
    release: 0.05,
    shape: 4,
    repeatTime: 0.11,
    noise: 0.3,
    sustainVolume: 0.5,
  }),
  /** Soft snore: falling asleep. */
  sleep: zzfxParams({
    volume: 0.5,
    randomness: 0.05,
    frequency: 110,
    attack: 0.2,
    sustain: 0.2,
    release: 0.4,
    shape: 0,
    slide: -2,
    noise: 0.2,
    sustainVolume: 0.5,
  }),
  /** Shutter: a photo is taken. */
  camera: zzfxParams({
    volume: 0.9,
    randomness: 0,
    frequency: 1200,
    attack: 0,
    sustain: 0.01,
    release: 0.05,
    shape: 4,
    noise: 1,
    repeatTime: 0.06,
    sustainVolume: 0.5,
  }),
  /** Soft chime: a bot starts something new. */
  chime: zzfxParams({
    volume: 0.45,
    randomness: 0.02,
    frequency: 880,
    attack: 0.005,
    sustain: 0.03,
    release: 0.35,
    shape: 0,
    sustainVolume: 0.5,
    decay: 0.05,
  }),
  /** Happy jingle: a need is satisfied, a gift lands. */
  jingle: zzfxParams({
    volume: 0.7,
    randomness: 0.02,
    frequency: 600,
    attack: 0.01,
    sustain: 0.05,
    release: 0.25,
    shape: 0,
    pitchJump: 300,
    pitchJumpTime: 0.06,
    repeatTime: 0.12,
    sustainVolume: 0.6,
  }),
  /** Wooden knock-knock: a tool tapping on the workbench. */
  knock: zzfxParams({
    volume: 0.9,
    randomness: 0.08,
    frequency: 150,
    attack: 0,
    sustain: 0.01,
    release: 0.06,
    shape: 0,
    shapeCurve: 2,
    slide: -20,
    repeatTime: 0.11,
    sustainVolume: 0.5,
  }),
  /** Rising sparkle: something was made at the workbench, or a fix went in. */
  craft: zzfxParams({
    volume: 0.6,
    randomness: 0.02,
    frequency: 520,
    attack: 0.01,
    sustain: 0.08,
    release: 0.3,
    shape: 0,
    slide: 4,
    pitchJump: 260,
    pitchJumpTime: 0.07,
    repeatTime: 0.1,
    sustainVolume: 0.6,
  }),
  /** Soft "boing": that tool does not go there (playful, never a buzzer). */
  boing: zzfxParams({
    volume: 0.6,
    randomness: 0,
    frequency: 180,
    attack: 0.01,
    sustain: 0.06,
    release: 0.18,
    shape: 0,
    slide: 3,
    deltaSlide: 0.2,
    modulation: 6,
    sustainVolume: 0.6,
  }),
  /** Beep-beep: the fixed car honks. */
  honk: zzfxParams({
    volume: 0.5,
    randomness: 0,
    frequency: 392,
    attack: 0.01,
    sustain: 0.08,
    release: 0.05,
    shape: 2,
    repeatTime: 0.18,
    sustainVolume: 0.8,
  }),
  /** Ding-dong: a visitor at the door. */
  doorbell: zzfxParams({
    volume: 0.9,
    randomness: 0,
    frequency: 660,
    attack: 0.01,
    sustain: 0.18,
    release: 0.5,
    shape: 0,
    pitchJump: -140,
    pitchJumpTime: 0.22,
    sustainVolume: 0.6,
  }),
} satisfies Record<string, ZzfxParams>;

/** One "Pocketese" syllable: a short pitched blip (a character's voice). */
export function blipParams(frequency: number): ZzfxParams {
  return zzfxParams({
    volume: 0.5,
    randomness: 0.15,
    frequency,
    attack: 0.01,
    sustain: 0.03,
    release: 0.06,
    shape: 1, // triangle
    slide: 4,
    modulation: 2,
    sustainVolume: 0.7,
  });
}

export type SfxName = keyof typeof sfx;
