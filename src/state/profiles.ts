// Player profiles live on this device only. Milestone M5 adds creating and picking
// profiles; for now there is at most an active profile with an optional age.
import { create } from 'zustand';

export interface ProfileSummary {
  id: string;
  /** Age picked on the age screen; stored on the device only. */
  age: number | null;
}

interface ProfilesStore {
  active: ProfileSummary | null;
  setActive: (profile: ProfileSummary | null) => void;
}

export const useProfiles = create<ProfilesStore>()((set) => ({
  active: null,
  setActive: (active) => set({ active }),
}));
