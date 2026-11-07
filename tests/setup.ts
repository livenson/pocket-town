// jsdom has no Web Audio. ZzFX creates its AudioContext when imported, so give it a
// small stand-in that records what was played.
import 'fake-indexeddb/auto';
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

// jsdom has no matchMedia: report "no match" for every query (tablet layout, motion allowed).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Testing Library only sets this automatically when test globals exist; we use
// explicit imports, so tell React that tests wrap updates in act().
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => {
  cleanup();
});
