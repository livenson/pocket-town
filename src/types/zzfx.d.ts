// Minimal types for the parts of ZzFX we use (the package ships none).
declare module 'zzfx' {
  /** ZzFX sound parameters, positional; `undefined` means "use the default". */
  export type ZzfxParams = (number | undefined)[];

  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play(...parameters: ZzfxParams): AudioBufferSourceNode;
    buildSamples(...parameters: ZzfxParams): number[];
  };

  export function zzfx(...parameters: ZzfxParams): AudioBufferSourceNode;
}
