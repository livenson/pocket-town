// The character being made right now (dice avatar, then the full wizard in M6).
import { create } from 'zustand';
import type { Appearance } from '../content/appearance';
import { randomLook, randomName, randomTraits } from '../content/looks';
import type { TraitId } from '../content/traits';

/** What the avatar wizard is making: a new player, a new character, or a change. */
export type CreationTarget =
  { kind: 'newPlayer' } | { kind: 'newBot' } | { kind: 'editBot'; botId: string };

interface CreationStore {
  target: CreationTarget;
  /** Age picked for the new player (null: not asked yet). */
  age: number | null;
  appearance: Appearance;
  name: string;
  traits: [TraitId, TraitId, TraitId];
  rolls: number;
  setAge: (age: number | null) => void;
  roll: () => void;
  set: (patch: Partial<Pick<CreationStore, 'appearance' | 'name' | 'traits' | 'target'>>) => void;
  reset: () => void;
}

export const useCreation = create<CreationStore>()((set, get) => ({
  target: { kind: 'newPlayer' },
  age: null,
  appearance: randomLook(),
  name: randomName(),
  traits: randomTraits(),
  rolls: 0,
  setAge: (age) => set({ age }),
  roll: () =>
    set({
      appearance: randomLook(),
      name: randomName(get().name),
      traits: randomTraits(),
      rolls: get().rolls + 1,
    }),
  set: (patch) => set(patch),
  reset: () =>
    set({
      target: { kind: 'newPlayer' },
      age: null,
      appearance: randomLook(),
      name: randomName(),
      traits: randomTraits(),
      rolls: 0,
    }),
}));
