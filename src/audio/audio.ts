// Audio output. Browsers (iOS Safari in particular) keep audio silent until it is
// started inside a user gesture, so `installAudioUnlock` resumes the shared
// AudioContext (and unlocks speech) on the first tap, click or key press.
import { ZZFX } from 'zzfx';
import { useSettings } from '../state/settings';
import { blipParams, sfx, type SfxName } from './sfx';
import { unlockSpeech } from './speech';

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const;
/** ZzFX's own default master volume; the effects setting scales it. */
const BASE_VOLUME = 0.3;

function context(): AudioContext {
  return ZZFX.audioContext;
}

/** Audio can only start once the person has tapped, clicked or pressed a key. */
function mayStart(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  return activation?.hasBeenActive ?? true;
}

function unlock(): void {
  const ctx = context();
  if (ctx.state !== 'running') {
    if (!mayStart()) return;
    void ctx.resume();
    // Playing a one-sample silent buffer inside the gesture is what older iOS
    // versions need before they will let later sounds through.
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
  }
}

let installed = false;

/** Listen for the first user gestures and unlock audio. Safe to call more than once. */
export function installAudioUnlock(target: Window = window): void {
  if (installed) return;
  installed = true;
  let speechUnlocked = false;
  const handler = (): void => {
    unlock();
    if (!speechUnlocked) {
      speechUnlocked = true;
      unlockSpeech();
    }
    if (context().state === 'running') {
      for (const type of UNLOCK_EVENTS) target.removeEventListener(type, handler, true);
    }
  };
  for (const type of UNLOCK_EVENTS) {
    target.addEventListener(type, handler, { capture: true, passive: true });
  }
}

/** Play a named sound effect. Never throws: sound is a nice-to-have, not a requirement. */
export function playSfx(name: SfxName): void {
  const volume = useSettings.getState().effectsVolume;
  if (volume <= 0 || (context().state !== 'running' && !mayStart())) return;
  try {
    unlock();
    ZZFX.volume = BASE_VOLUME * volume;
    ZZFX.play(...sfx[name]);
  } catch {
    // Audio unavailable (no device, blocked, etc.): play continues silently.
  }
}

/**
 * A few "Pocketese" syllables in a character's own pitch range: rhythm and
 * feeling without words (DESIGN.md → Sound).
 */
export function speakPocketese(basePitch: number, syllables = 2): void {
  const volume = useSettings.getState().effectsVolume;
  if (volume <= 0 || (context().state !== 'running' && !mayStart())) return;
  try {
    unlock();
    ZZFX.volume = BASE_VOLUME * volume;
    const ctx = context();
    for (let i = 0; i < syllables; i++) {
      const samples = ZZFX.buildSamples(...blipParams(basePitch * (0.9 + 0.25 * ((i * 7) % 3))));
      const buffer = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
      buffer.getChannelData(0).set(samples);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime + i * 0.13);
    }
  } catch {
    // Audio unavailable: the emote bubble still shows.
  }
}
