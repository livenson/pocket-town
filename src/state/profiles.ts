// Player profiles: faces, no passwords, up to six per device. Stored on the device
// only, like everything else.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Appearance } from '../content/appearance';
import type { TraitId } from '../content/traits';
import { idbStorage } from '../persist/idbStorage';

export const MAX_PROFILES = 6;

export interface Profile {
  id: string;
  name: string;
  appearance: Appearance;
  traits: [TraitId, TraitId, TraitId];
  /** Picked on the age screen. Never leaves the device. */
  age: number | null;
  /** The first-play hints have been completed: they never come back. */
  hintsDone: boolean;
  createdAt: number;
}

/** What the rest of the app needs to know about whoever is playing. */
export interface ProfileSummary {
  id: string;
  age: number | null;
}

interface ProfilesStore {
  profiles: Profile[];
  activeId: string | null;
  /** The player now, or null before anyone has been picked. */
  active: ProfileSummary | null;
  hydrated: boolean;
  add: (p: Profile) => void;
  setActive: (summary: ProfileSummary | null) => void;
  choose: (id: string) => void;
  update: (id: string, patch: Partial<Profile>) => void;
  remove: (id: string) => void;
}

function summary(p: Profile | undefined): ProfileSummary | null {
  return p ? { id: p.id, age: p.age } : null;
}

export const useProfiles = create<ProfilesStore>()(
  persist(
    (set) => ({
      profiles: [],
      activeId: null,
      active: null,
      hydrated: false,
      add: (p) =>
        set((s) => ({
          profiles: [...s.profiles, p].slice(-MAX_PROFILES),
          activeId: p.id,
          active: summary(p),
        })),
      setActive: (active) => set({ active }),
      choose: (id) =>
        set((s) => ({ activeId: id, active: summary(s.profiles.find((p) => p.id === id)) })),
      update: (id, patch) =>
        set((s) => {
          const profiles = s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
          return {
            profiles,
            active: s.activeId === id ? summary(profiles.find((p) => p.id === id)) : s.active,
          };
        }),
      remove: (id) =>
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
          active: s.activeId === id ? null : s.active,
        })),
    }),
    {
      name: 'pocket-town:profiles',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ profiles }) => ({ profiles }),
      onRehydrateStorage: () => () => useProfiles.setState({ hydrated: true }),
    },
  ),
);

export function newProfileId(): string {
  return `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}
