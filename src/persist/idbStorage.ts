// Key-value storage on IndexedDB for the Zustand persist middleware.
import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

export const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    // Not available (private mode, old browser): saves still work, just evictable.
  }
  return false;
}
