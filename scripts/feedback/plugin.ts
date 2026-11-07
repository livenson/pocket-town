// Dev-server only: the kid's side of the feedback inbox. Never part of a build.
// Started with `npm run feedback` (this computer) or `npm run feedback:lan`
// (a tablet on the same Wi-Fi, over https so the microphone works).
import { existsSync, mkdirSync, watch, type FSWatcher } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import {
  INBOX,
  isId,
  listItems,
  newId,
  readItem,
  summary,
  transcribe,
  writeFile,
  writeItem,
  type Item,
  type Mood,
  type Point,
  type Round,
} from './store.ts';

const MAX_BODY = 30 * 1024 * 1024;
const MOODS: Mood[] = ['love', 'ok', 'sad', 'idea'];

// The body comes from a browser: check every field instead of trusting its shape.
type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 4000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const field = (v: unknown, key: string): unknown => (isObj(v) ? v[key] : undefined);

function point(v: unknown): Point | null {
  if (!isObj(v)) return null;
  const p: Point = { x: num(v.x), y: num(v.y), onStage: v.onStage === true };
  if (typeof v.label === 'string') p.label = str(v.label, 120);
  if (typeof v.element === 'string') p.element = str(v.element, 200);
  return p;
}

function trail(v: unknown): Round['trail'] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObj)
    .slice(-30)
    .map((t) => ({ at: num(t.at), screen: str(t.screen, 40), label: str(t.label, 120) }));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too big'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

const extFor = (mime: string) =>
  mime.includes('mp4') || mime.includes('aac') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';

/** Save the files of one round and return its record. */
function saveRound(item: Item, body: unknown): Round {
  const n = item.rounds.length;
  const mood = field(body, 'mood');
  const round: Round = {
    at: Date.now(),
    mood: MOODS.find((m) => m === mood) ?? null,
    text: str(field(body, 'text')),
    point: point(field(body, 'point')),
    trail: trail(field(body, 'trail')),
    screen: str(field(body, 'screen'), 40),
    roomId: str(field(body, 'roomId'), 60),
  };
  const png = str(field(body, 'screenshot'), MAX_BODY).match(/^data:image\/png;base64,(.+)$/)?.[1];
  if (png) {
    round.screenshot = `screen-${n}.png`;
    writeFile(item.id, round.screenshot, Buffer.from(png, 'base64'));
  }
  const voice = field(body, 'voice');
  const audio = str(field(voice, 'data'), MAX_BODY);
  if (audio) {
    round.voice = `voice-${n}.${extFor(str(field(voice, 'mime'), 60))}`;
    writeFile(item.id, round.voice, Buffer.from(audio, 'base64'));
  }
  const world = field(body, 'world');
  if (world !== undefined) writeFile(item.id, `world-${n}.json`, JSON.stringify(world));
  return round;
}

/** Transcribe in the background; the item is updated when the text is ready. */
function transcribeLater(id: string, roundIndex: number): void {
  const item = readItem(id);
  const voice = item?.rounds[roundIndex]?.voice;
  if (!item || !voice) return;
  void transcribe(id, voice, item.language).then((text) => {
    if (!text) return;
    const fresh = readItem(id);
    const round = fresh?.rounds[roundIndex];
    if (!fresh || !round) return;
    round.transcript = text;
    writeItem(fresh);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  if (req.method === 'GET' && path === '/items') {
    send(res, 200, { items: listItems().map(summary) });
    return;
  }
  if (req.method === 'POST' && path === '/items') {
    const body = await readBody(req);
    const player = field(body, 'player');
    const viewport = field(body, 'viewport');
    const age = field(player, 'age');
    const now = Date.now();
    const item: Item = {
      id: newId(now),
      createdAt: now,
      updatedAt: now,
      status: 'new',
      language: ['en', 'et', 'lv'].find((l) => l === field(body, 'language')) ?? 'en',
      player: isObj(player)
        ? { name: str(player.name, 40), age: typeof age === 'number' ? age : null }
        : null,
      layout: str(field(body, 'layout'), 20),
      viewport: {
        w: num(field(viewport, 'w')),
        h: num(field(viewport, 'h')),
        dpr: num(field(viewport, 'dpr')) || 1,
      },
      userAgent: str(field(body, 'userAgent'), 300),
      rounds: [],
      replies: [],
      verdicts: [],
    };
    item.rounds.push(saveRound(item, body));
    writeItem(item);
    transcribeLater(item.id, 0);
    send(res, 200, { id: item.id });
    return;
  }
  const verdict = path.match(/^\/items\/([a-z0-9-]+)\/verdict$/);
  if (req.method === 'POST' && verdict?.[1] && isId(verdict[1])) {
    const item = readItem(verdict[1]);
    if (!item) return send(res, 404, { ok: false });
    const body = await readBody(req);
    const v = field(body, 'verdict');
    const at = Date.now();
    if (item.status === 'proposed' && (v === 'keep' || v === 'undo' || v === 'again')) {
      item.verdicts.push({ at, verdict: v });
      item.status = v === 'keep' ? 'kept' : v === 'undo' ? 'undone' : 'again';
      const round = field(body, 'round');
      if (v === 'again' && isObj(round)) item.rounds.push(saveRound(item, round));
    } else if (item.status === 'declined' && v === 'heard') {
      item.verdicts.push({ at, verdict: 'heard' });
      item.status = 'closed';
    } else {
      return send(res, 409, { ok: false, status: item.status });
    }
    writeItem(item);
    if (v === 'again') transcribeLater(item.id, item.rounds.length - 1);
    send(res, 200, { ok: true });
    return;
  }
  send(res, 404, { ok: false });
}

export function kidFeedback(): Plugin {
  let watcher: FSWatcher | null = null;
  return {
    name: 'pocket-town:kid-feedback',
    apply: (_config, env) => env.command === 'serve' && env.mode.startsWith('feedback'),
    configureServer(server: ViteDevServer) {
      mkdirSync(INBOX, { recursive: true });
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/__feedback/')) return next();
        const path = url.slice('/__feedback'.length).split('?')[0] ?? '';
        handle(req, res, path).catch(() => send(res, 400, { ok: false }));
      });
      // Tell open pages when Claude (or the kid on another device) changes something.
      let timer: ReturnType<typeof setTimeout> | null = null;
      const broadcast = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          server.ws.send('pt-feedback', { items: listItems().map(summary) });
        }, 150);
      };
      if (existsSync(INBOX)) watcher = watch(INBOX, { recursive: true }, broadcast);
      server.httpServer?.on('close', () => watcher?.close());
    },
  };
}
