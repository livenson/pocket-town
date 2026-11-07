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
  pop: zzfxParams({
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
} satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof sfx;
