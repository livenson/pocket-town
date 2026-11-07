// Kid feedback inbox, shared by the dev-server plugin (the kid's side) and the CLI
// (Claude Code's side). Everything lives in `feedback/` at the repo root, which is
// git-ignored: voices and screenshots never leave this computer.
import { execFile, execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const ROOT = resolve(import.meta.dirname, '../..');
export const INBOX = join(ROOT, 'feedback');

/**
 * new       the kid sent something; Claude has not looked yet
 * thinking  Claude is working on it (the kid sees a thinking sparkle)
 * proposed  Claude changed the game and asks the kid: keep it?
 * declined  Claude can't or won't do it, and says so kindly (the kid hears it once)
 * kept      the kid likes the change: Claude commits it
 * undone    the kid doesn't like it: Claude puts everything back
 * again     the kid wants it different: Claude keeps working on the same change
 * committed / reverted / closed: finished
 */
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

export type Mood = 'love' | 'ok' | 'sad' | 'idea';

export interface Point {
  /** CSS px in the kid's viewport. */
  x: number;
  y: number;
  /** What was under the finger: the accessible name, if it had one. */
  label?: string;
  /** A short CSS-ish path to the element (tag.class > ...). */
  element?: string;
  /** On the play stage: the canvas was under the finger. */
  onStage?: boolean;
}

export interface Round {
  at: number;
  mood: Mood | null;
  text: string;
  transcript?: string;
  /** File names inside the item folder. */
  voice?: string;
  screenshot?: string;
  point?: Point | null;
  /** The last few things the kid tapped before this, oldest first. */
  trail: { at: number; screen: string; label: string }[];
  screen: string;
  roomId: string;
}

export interface Reply {
  at: number;
  kind: 'proposal' | 'decline';
  /** Spoken to the kid, in their language. Short and kind. */
  say: string;
  /** Where "show me" takes the kid. */
  screen?: string;
  roomId?: string;
}

export interface Item {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: Status;
  language: string;
  player: { name: string; age: number | null } | null;
  layout: string;
  viewport: { w: number; h: number; dpr: number };
  userAgent: string;
  rounds: Round[];
  replies: Reply[];
  verdicts: { at: number; verdict: 'keep' | 'undo' | 'again' | 'heard' }[];
  git?: { base: string; commit?: string; stash?: string };
}

/** Statuses where Claude is up next, most urgent first. */
export const FOR_CLAUDE: Status[] = ['kept', 'undone', 'again', 'new'];

const ID = /^[a-z0-9-]{6,40}$/;

export function isId(id: string): boolean {
  return ID.test(id);
}

export function itemDir(id: string): string {
  if (!isId(id)) throw new Error(`bad feedback id: ${id}`);
  return join(INBOX, id);
}

const p2 = (n: number) => String(n).padStart(2, '0');

export function newId(now = Date.now()): string {
  const d = new Date(now);
  const p = p2;
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}

function isItem(v: unknown): v is Item {
  return (
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    typeof v.id === 'string' &&
    'status' in v &&
    typeof v.status === 'string' &&
    'rounds' in v &&
    Array.isArray(v.rounds) &&
    'replies' in v &&
    Array.isArray(v.replies)
  );
}

export function readItem(id: string): Item | null {
  const file = join(itemDir(id), 'item.json');
  if (!existsSync(file)) return null;
  try {
    const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return isItem(data) ? data : null;
  } catch {
    return null;
  }
}

/** Write atomically, so the other side never reads half a file. */
export function writeItem(item: Item): void {
  const dir = itemDir(item.id);
  mkdirSync(dir, { recursive: true });
  item.updatedAt = Date.now();
  const tmp = join(dir, `.item.${process.pid}.tmp`);
  writeFileSync(tmp, JSON.stringify(item, null, 2));
  renameSync(tmp, join(dir, 'item.json'));
}

export function writeFile(id: string, name: string, data: Buffer | string): void {
  if (!/^[a-z0-9.-]+$/.test(name)) throw new Error(`bad file name: ${name}`);
  const dir = itemDir(id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), data);
}

export function listItems(): Item[] {
  if (!existsSync(INBOX)) return [];
  return readdirSync(INBOX)
    .filter(isId)
    .map(readItem)
    .filter((i): i is Item => i !== null)
    .toSorted((a, b) => a.createdAt - b.createdAt);
}

/** The next item Claude should handle, or null. Verdicts first: they unblock the tree. */
export function nextForClaude(items = listItems()): Item | null {
  // One change at a time: new ideas wait while another change is being made or
  // is waiting for the kid's answer, so a "no" can be put back cleanly.
  const inFlight = items.some((i) => ['thinking', 'proposed', 'again'].includes(i.status));
  for (const status of FOR_CLAUDE) {
    if (status === 'new' && inFlight) continue;
    const found = items.find((i) => i.status === status);
    if (found) return found;
  }
  return null;
}

/** What the kid's screen needs: no file paths, no world. */
export function summary(item: Item) {
  return {
    id: item.id,
    status: item.status,
    updatedAt: item.updatedAt,
    reply: item.replies.at(-1) ?? null,
    mood: item.rounds[0]?.mood ?? null,
  };
}

// --- Voice to text, on this computer only -------------------------------------

const MODEL_CANDIDATES = [
  process.env.WHISPER_MODEL,
  join(homedir(), '.cache/whisper/ggml-small.bin'),
  join(homedir(), '.cache/whisper/ggml-base.bin'),
  '/opt/homebrew/share/whisper-cpp/ggml-small.bin',
  '/opt/homebrew/share/whisper-cpp/ggml-base.bin',
];

function which(cmd: string): string | null {
  try {
    return execFileSync('/usr/bin/which', [cmd], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

export function transcriber(): { cli: string; model: string; ffmpeg: string } | null {
  const cli = process.env.WHISPER_CLI ?? which('whisper-cli');
  const ffmpeg = which('ffmpeg');
  const model = MODEL_CANDIDATES.find((m): m is string => !!m && existsSync(m));
  return cli && ffmpeg && model ? { cli, model, ffmpeg } : null;
}

/**
 * Turn a recording into text with whisper.cpp (no network). Returns null when
 * whisper.cpp or a model is not installed; the recording is kept either way.
 */
export async function transcribe(
  id: string,
  voiceFile: string,
  language: string,
): Promise<string | null> {
  const t = transcriber();
  if (!t) return null;
  const dir = itemDir(id);
  const wav = join(dir, `${voiceFile}.wav`);
  try {
    await run(t.ffmpeg, [
      '-y',
      '-loglevel',
      'error',
      '-i',
      join(dir, voiceFile),
      '-ar',
      '16000',
      '-ac',
      '1',
      wav,
    ]);
    const { stdout } = await run(t.cli, ['-m', t.model, '-l', language, '-nt', '-np', '-f', wav], {
      timeout: 180_000,
    });
    return stdout.replace(/\s+/g, ' ').trim();
  } catch {
    return null;
  }
}

// --- Git, for the CLI ------------------------------------------------------------

export function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Changed files in the working tree (feedback/ is ignored, so it never shows). */
export function dirtyFiles(): string[] {
  // Not git(): trimming would eat the first line's leading status column.
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3));
}
