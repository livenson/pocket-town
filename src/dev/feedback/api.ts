// Talks to the dev-server inbox (scripts/feedback/plugin.ts). Same origin only.
import { create } from 'zustand';

export type Status =
  | 'new'
  | 'thinking'
  | 'proposed'
  | 'declined'
  | 'kept'
  | 'undone'
  | 'again'
  | 'committed'
  | 'reverted'
  | 'closed';

export interface Reply {
  at: number;
  kind: 'proposal' | 'decline';
  say: string;
  screen?: string;
  roomId?: string;
}

export interface ItemSummary {
  id: string;
  status: Status;
  updatedAt: number;
  reply: Reply | null;
}

export interface RoundPayload {
  mood: string | null;
  text: string;
  point: { x: number; y: number; label?: string; element?: string; onStage?: boolean } | null;
  trail: { at: number; screen: string; label: string }[];
  screen: string;
  roomId: string;
  screenshot: string | null;
  voice: { mime: string; data: string } | null;
  world: unknown;
}

interface InboxState {
  items: ItemSummary[];
}

export const useInbox = create<InboxState>()(() => ({ items: [] }));

/** Claude is working on something the kid sent. */
export const BUSY: Status[] = ['new', 'thinking', 'again', 'kept', 'undone'];

const URL_BASE = '/__feedback';

function isInbox(v: unknown): v is InboxState {
  return typeof v === 'object' && v !== null && 'items' in v && Array.isArray(v.items);
}

async function post(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(URL_BASE + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function refresh(): Promise<void> {
  try {
    const res = await fetch(`${URL_BASE}/items`, { cache: 'no-store' });
    const data: unknown = res.ok ? await res.json() : null;
    if (isInbox(data)) useInbox.setState(data);
  } catch {
    // Dev server restarting: the next push or refresh catches up.
  }
}

export function sendNew(payload: RoundPayload & Record<string, unknown>): Promise<boolean> {
  return post('/items', payload);
}

export function sendVerdict(
  id: string,
  verdict: 'keep' | 'undo' | 'again' | 'heard',
  round?: RoundPayload,
): Promise<boolean> {
  return post(`/items/${id}/verdict`, { verdict, round });
}

/** Keep the list fresh: the dev server pushes changes over the hot-reload socket. */
export function listen(): void {
  void refresh();
  import.meta.hot?.on('pt-feedback', (data: InboxState) => useInbox.setState(data));
  // After a dev-server restart the socket reconnects; catch up then.
  import.meta.hot?.on('vite:ws:connect', () => void refresh());
}
