// Child settings, persisted on the device.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../persist/idbStorage';

import type { Language } from '../i18n/languages';

export type BotEnergy = 'lively' | 'calm' | 'paused';

export interface Settings {
  /** 0–1 */
  effectsVolume: number;
  /** 0–1 */
  musicVolume: number;
  /** 0–1 */
  voiceVolume: number;
  voiceOver: boolean;
  textLabels: boolean;
  leftHanded: boolean;
  /** The things drawer folded away (tablet and desktop), to see more of the room. */
  drawerHidden: boolean;
  calmMotion: boolean;
  botEnergy: BotEnergy;
  /** 'auto' follows the device language. Set by grown-ups. */
  language: Language | 'auto';
}

export const defaultSettings: Settings = {
  effectsVolume: 0.8,
  musicVolume: 0.6,
  voiceVolume: 0.9,
  voiceOver: true,
  textLabels: false,
  leftHanded: false,
  drawerHidden: false,
  calmMotion: false,
  botEnergy: 'lively',
  language: 'auto',
};

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      update: (patch) => set(patch),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'pocket-town:settings',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ update: _u, reset: _r, ...settings }) => settings,
    },
  ),
);
