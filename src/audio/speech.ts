// Voice-over. Behind an interface so recorded voice can replace the Web Speech API later.
import { useSettings } from '../state/settings';

export interface VoiceOutput {
  speak(text: string, volume: number): void;
  cancel(): void;
}

class WebSpeechVoice implements VoiceOutput {
  private voice: SpeechSynthesisVoice | null = null;

  private synth(): SpeechSynthesis | null {
    return typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
  }

  private pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
    if (this.voice) return this.voice;
    const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
    // Prefer an on-device voice: network voices would send text off the device.
    this.voice = voices.find((v) => v.localService) ?? null;
    return this.voice;
  }

  speak(text: string, volume: number): void {
    const synth = this.synth();
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.pickVoice(synth);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'en';
    utterance.volume = volume;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    synth.speak(utterance);
  }

  cancel(): void {
    this.synth()?.cancel();
  }
}

let output: VoiceOutput = new WebSpeechVoice();

/** Swap the voice output (recorded voice later; a fake in tests). */
export function setVoiceOutput(next: VoiceOutput): void {
  output = next;
}

/** Speak a label or instruction, if voice-over is on. */
export function speak(text: string): void {
  const { voiceOver, voiceVolume } = useSettings.getState();
  if (!voiceOver || voiceVolume <= 0 || !text) return;
  try {
    output.speak(text, voiceVolume);
  } catch {
    // Speech unavailable: the icon still carries the meaning.
  }
}

export function stopSpeaking(): void {
  try {
    output.cancel();
  } catch {
    // ignore
  }
}

/**
 * iOS only lets speech start from inside a user gesture. Speaking an empty, silent
 * utterance on the first gesture unlocks it for later (timer-driven) speech.
 */
export function unlockSpeech(): void {
  if (typeof speechSynthesis === 'undefined') return;
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}
