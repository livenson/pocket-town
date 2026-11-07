// Child settings, persisted on the device.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../persist/idbStorage';

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
  calmMotion: boolean;
  botEnergy: BotEnergy;
}

export const defaultSettings: Settings = {
  effectsVolume: 0.8,
  musicVolume: 0.6,
  voiceVolume: 0.9,
  voiceOver: true,
  textLabels: false,
  leftHanded: false,
  calmMotion: false,
  botEnergy: 'lively',
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
