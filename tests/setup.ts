// jsdom has no Web Audio. ZzFX creates its AudioContext when imported, so give it a
// small stand-in that records what was played.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  sampleRate = 44100;
  destination = {};
  started = 0;
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  createBuffer(channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length), numberOfChannels: channels, length };
  }
  createBufferSource() {
    return {
      buffer: null as unknown,
      connect: () => undefined,
      start: () => {
        this.started += 1;
      },
    };
  }
  createStereoPanner() {
    return { pan: { value: 0 }, connect: () => undefined };
  }
}

Object.assign(globalThis, { AudioContext: FakeAudioContext });

afterEach(() => {
  cleanup();
});
