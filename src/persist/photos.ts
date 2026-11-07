// The photo album, on this device only (IndexedDB). No sharing.
import { del, get, set } from 'idb-keyval';

const INDEX_KEY = 'pocket-town:photos';
const photoKey = (id: string) => `pocket-town:photo:${id}`;
export const MAX_PHOTOS = 60;

export interface PhotoInfo {
  id: string;
  takenAt: number;
}

/** Photos are stored as bytes, not Blobs: some browsers refuse Blobs in IndexedDB. */
interface StoredPhoto {
  type: string;
  bytes: ArrayBuffer;
}

export async function listPhotos(): Promise<PhotoInfo[]> {
  return (await get<PhotoInfo[]>(INDEX_KEY)) ?? [];
}

export async function savePhoto(blob: Blob): Promise<PhotoInfo> {
  const info: PhotoInfo = {
    id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    takenAt: Date.now(),
  };
  const stored: StoredPhoto = { type: blob.type || 'image/png', bytes: await blob.arrayBuffer() };
  await set(photoKey(info.id), stored);
  const list = [info, ...(await listPhotos())];
  // Keep the album to a sensible size: the oldest photos make way for new ones.
  for (const old of list.slice(MAX_PHOTOS)) await del(photoKey(old.id));
  await set(INDEX_KEY, list.slice(0, MAX_PHOTOS));
  return info;
}

export async function loadPhoto(id: string): Promise<Blob | undefined> {
  const stored = await get<StoredPhoto>(photoKey(id));
  return stored ? new Blob([stored.bytes], { type: stored.type }) : undefined;
}

export async function deletePhoto(id: string): Promise<void> {
  await del(photoKey(id));
  await set(
    INDEX_KEY,
    (await listPhotos()).filter((p) => p.id !== id),
  );
}
