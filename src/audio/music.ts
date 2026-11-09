// Plays the background music (compose.ts) on the shared audio context: a small
// scheduler that sets each note a moment ahead, so timing stays steady. The music
// setting's volume applies (0 turns it off); a change of mood fades over a second;
// a hidden page is quiet.
import { useSettings } from '../state/settings';
import { audioContext } from './audio';
import { composeBar, frequency, songs, STEPS_PER_BAR, type Mood, type Note } from './compose';

/** Loudness at full music volume (music sits under the sound effects and voices). */
const MAX_GAIN = 0.11;
const LOOKAHEAD_S = 0.3;
const TICK_MS = 100;
const FADE_S = 0.9;

class MusicPlayer {
  private mood: Mood | null = null;
  private wanted: Mood | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private bar = 0;
  private step = 0;
  private nextAt = 0;
  private notes: Note[] = [];
  private switchingUntil = 0;

  /** The music to play now (null: silence). */
  setMood(mood: Mood | null): void {
    this.wanted = mood;
    if (this.timer === null && typeof window !== 'undefined')
      this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  private volume(): number {
    const hidden = typeof document !== 'undefined' && document.hidden;
    return hidden || this.mood === null ? 0 : MAX_GAIN * useSettings.getState().musicVolume;
  }

  private ensureMaster(ctx: AudioContext): GainNode {
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      // Soften everything a little.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3200;
      this.master.connect(filter);
      filter.connect(ctx.destination);
    }
    return this.master;
  }

  private tick(): void {
    // Music is a nice-to-have: audio that is missing or broken never stops play.
    try {
      this.schedule();
    } catch {
      // Silent until it works.
    }
  }

  private schedule(): void {
    const ctx = audioContext();
    // Before the first tap, browsers keep audio off: wait. Without real audio
    // (some test environments), there is nothing to play on.
    if (ctx.state !== 'running' || typeof ctx.createGain !== 'function') return;
    const master = this.ensureMaster(ctx);
    const now = ctx.currentTime;
    // A new mood: fade out, then start the new song from its beginning.
    if (this.wanted !== this.mood && now >= this.switchingUntil) {
      if (this.mood !== null && master.gain.value > 0.005) {
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0, now, FADE_S / 4);
        this.switchingUntil = now + FADE_S;
        return;
      }
      this.mood = this.wanted;
      this.bar = 0;
      this.step = 0;
      this.nextAt = now + 0.1;
      this.notes = this.mood ? composeBar(songs[this.mood], 0) : [];
    }
    if (now < this.switchingUntil) return;
    master.gain.setTargetAtTime(this.volume(), now, 0.3);
    if (!this.mood) return;
    const song = songs[this.mood];
    const stepS = 60 / song.tempo / 2;
    // Fell behind (tab was asleep): start again from now, not with a burst.
    if (this.nextAt < now - 0.5) this.nextAt = now + 0.05;
    while (this.nextAt < now + LOOKAHEAD_S) {
      for (const n of this.notes) if (n.step === this.step) this.play(ctx, master, n, stepS);
      this.step++;
      if (this.step >= STEPS_PER_BAR) {
        this.step = 0;
        this.bar++;
        this.notes = composeBar(song, this.bar);
      }
      this.nextAt += stepS;
    }
  }

  private play(ctx: AudioContext, out: AudioNode, n: Note, stepS: number): void {
    const t = this.nextAt;
    const length = n.steps * stepS;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lead = this.mood ? songs[this.mood].lead : 'sine';
    osc.type = n.voice === 'lead' ? lead : n.voice === 'bass' ? 'triangle' : 'sine';
    osc.frequency.value = frequency(n.midi);
    const peak = n.velocity * (n.voice === 'pad' ? 0.18 : n.voice === 'bass' ? 0.5 : 0.42);
    const attack = n.voice === 'pad' ? 0.4 : 0.015;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.setTargetAtTime(0, t + Math.max(attack, length * 0.6), length * 0.25 + 0.05);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + length + 0.6);
  }
}

export const music = new MusicPlayer();
