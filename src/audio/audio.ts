// Audio output. Browsers (iOS Safari in particular) keep audio silent until it is
// started inside a user gesture, so `installAudioUnlock` resumes the shared
// AudioContext on the first tap, click or key press.
import { ZZFX } from 'zzfx';
import { sfx, type SfxName } from './sfx';

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const;

function context(): AudioContext {
  return ZZFX.audioContext;
}

function unlock(): void {
  const ctx = context();
  if (ctx.state !== 'running') {
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
  const handler = (): void => {
    unlock();
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
  try {
    unlock();
    ZZFX.play(...sfx[name]);
  } catch {
    // Audio unavailable (no device, blocked, etc.): play continues silently.
  }
}
