// What a peg-folk character looks like (DESIGN.md → Peg-folk). No gender step:
// every option mixes freely.

export type HairStyle = 'bob' | 'puff' | 'bun' | 'crop' | 'none';
export type Eyes = 'open' | 'sleep' | 'wow';
export type Aid = 'none' | 'wheelchair' | 'hearing' | 'arm';

export interface Appearance {
  skin: string;
  outfit: string;
  hair: string;
  hairStyle: HairStyle;
  aid: Aid;
}
