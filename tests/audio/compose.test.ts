import { describe, expect, it } from 'vitest';
import { composeBar, frequency, songs, STEPS_PER_BAR } from '../../src/audio/compose';
import { moodFor } from '../../src/app/useMusic';
import { tuning } from '../../src/content/tuning';

const lead = (bar: number) =>
  composeBar(songs.cosy, bar)
    .filter((n) => n.voice === 'lead')
    .map((n) => [n.step, n.midi]);

describe('background music composed on the device', () => {
  it('is the same every time (no randomness between plays)', () => {
    expect(composeBar(songs.sunny, 5)).toEqual(composeBar(songs.sunny, 5));
  });

  it('repeats its phrase, with the last bar of the second time new', () => {
    expect(lead(4)).toEqual(lead(0));
    expect(lead(7)).not.toEqual(lead(3));
  });

  it('every bar has a chord and a bass, and notes stay in a gentle range', () => {
    for (const song of Object.values(songs))
      for (let bar = 0; bar < 16; bar++) {
        const notes = composeBar(song, bar);
        expect(notes.some((n) => n.voice === 'pad')).toBe(true);
        expect(notes.some((n) => n.voice === 'bass')).toBe(true);
        for (const n of notes) {
          expect(n.step).toBeGreaterThanOrEqual(0);
          expect(n.step).toBeLessThan(STEPS_PER_BAR);
          expect(n.midi).toBeGreaterThanOrEqual(28);
          expect(n.midi).toBeLessThanOrEqual(90);
        }
      }
  });

  it('notes are tuned to A = 440 Hz', () => {
    expect(frequency(69)).toBe(440);
    expect(frequency(81)).toBe(880);
  });

  it('cosy at home, sunny on the map, a lullaby at night, quiet at the piano', () => {
    const day = 10 * 60 - 8 * 60; // 10:00 (day 0 starts at 08:00)
    const night = tuning.nightStartMinute + 30 - 8 * 60;
    expect(moodFor('scene', day)).toBe('cosy');
    expect(moodFor('map', day)).toBe('sunny');
    expect(moodFor('scene', night)).toBe('lullaby');
    expect(moodFor('piano', day)).toBeNull();
    expect(moodFor('photoFace', night)).toBeNull();
  });
});
