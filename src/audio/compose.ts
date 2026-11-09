// Background music, composed on the device: no audio files, nothing fetched. Each
// mood is a short song (chords, a bass line and a melody on a five-note scale, so
// nothing ever sounds wrong) that repeats with small changes. Pure, so the notes
// can be tested; music.ts plays them.

export type Mood = 'cosy' | 'sunny' | 'lullaby';

export interface Song {
  /** Beats per minute (a beat is two steps). */
  tempo: number;
  /** MIDI note of the key's root. */
  root: number;
  /** Chord roots, in semitones above the key's root, one chord per bar. */
  chords: number[];
  /** 0–1: how many steps of a bar have a melody note. */
  density: number;
  /** The melody's sound. */
  lead: 'sine' | 'triangle';
  /** Bass on beats 1 and 3, or on every beat (bouncier). */
  bass: 'half' | 'beat';
  seed: number;
}

export const songs: Record<Mood, Song> = {
  // Home: warm and unhurried.
  cosy: {
    tempo: 84,
    root: 60,
    chords: [0, 7, 9, 5],
    density: 0.5,
    lead: 'sine',
    bass: 'half',
    seed: 11,
  },
  // Out in town: brighter and bouncier.
  sunny: {
    tempo: 108,
    root: 62,
    chords: [0, 5, 7, 5],
    density: 0.62,
    lead: 'triangle',
    bass: 'beat',
    seed: 23,
  },
  // Night: slow and sparse.
  lullaby: {
    tempo: 64,
    root: 57,
    chords: [0, 5, 0, 7],
    density: 0.32,
    lead: 'sine',
    bass: 'half',
    seed: 37,
  },
};

export interface Note {
  /** Step within the bar (8 steps: eighth notes). */
  step: number;
  /** MIDI note. */
  midi: number;
  /** Length in steps. */
  steps: number;
  voice: 'lead' | 'bass' | 'pad';
  /** 0–1. */
  velocity: number;
}

export const STEPS_PER_BAR = 8;
const PENTATONIC = [0, 2, 4, 7, 9];

/** A small deterministic random sequence (so a song is the same every time). */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The major triad on a chord root (semitones above the key). */
function triad(chord: number): number[] {
  // Chords on the 6th and 2nd are minor; the rest major.
  const minor = chord === 9 || chord === 2;
  return [chord, chord + (minor ? 3 : 4), chord + 7];
}

/**
 * The notes of one bar. Phrases are four bars long; the second phrase repeats the
 * first, with its last bar changed, so the tune is recognisable.
 */
export function composeBar(song: Song, bar: number): Note[] {
  const chord = song.chords[bar % song.chords.length] ?? 0;
  const notes: Note[] = [];
  // A soft chord held across the bar.
  for (const t of triad(chord))
    notes.push({ step: 0, midi: song.root + t - 12, steps: 8, voice: 'pad', velocity: 0.35 });
  // Bass on the chord's root.
  const bassSteps = song.bass === 'beat' ? [0, 2, 4, 6] : [0, 4];
  for (const step of bassSteps)
    notes.push({
      step,
      midi: song.root + chord - 24 + (step === 6 ? 7 : 0),
      steps: 2,
      voice: 'bass',
      velocity: step === 0 ? 0.8 : 0.6,
    });
  // The melody: the same phrase twice, the last bar of the second time new.
  const inPhrase = bar % 8;
  const phraseBar = inPhrase === 7 ? 7 : inPhrase % 4;
  const r = rng(song.seed * 101 + phraseBar * 7 + (bar % song.chords.length));
  const chordTones = new Set(triad(chord).map((t) => ((t % 12) + 12) % 12));
  let degree = Math.floor(r() * PENTATONIC.length);
  for (let step = 0; step < STEPS_PER_BAR; step++) {
    const strong = step % 2 === 0;
    if (r() > song.density * (strong ? 1.25 : 0.7)) continue;
    // Small steps up or down the scale; a leap now and then.
    degree += r() < 0.15 ? (r() < 0.5 ? -3 : 3) : r() < 0.5 ? -1 : 1;
    degree = Math.max(0, Math.min(PENTATONIC.length * 2 - 1, degree));
    let pitch = (PENTATONIC[degree % PENTATONIC.length] ?? 0) + 12 * Math.floor(degree / 5);
    // On strong steps, settle on a note of the chord.
    if (strong && !chordTones.has(pitch % 12)) pitch += 2;
    const last = step >= STEPS_PER_BAR - 2;
    notes.push({
      step,
      midi: song.root + pitch,
      steps: last ? 2 : r() < 0.3 ? 2 : 1,
      voice: 'lead',
      velocity: strong ? 0.75 : 0.55,
    });
  }
  return notes;
}

/** Frequency of a MIDI note, in hertz. */
export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
