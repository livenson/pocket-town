// Claude Code's side of the kid feedback inbox. Run with `node scripts/feedback/cli.ts`.
// See .claude/skills/kid-feedback/SKILL.md for the loop that uses it.
import { join } from 'node:path';
import {
  dirtyFiles,
  git,
  itemDir,
  listItems,
  nextForClaude,
  readItem,
  transcribe,
  transcriber,
  writeItem,
  type Item,
  type Reply,
} from './store.ts';

const [cmd = 'help', ...rest] = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = rest.indexOf(`--${name}`);
  if (i >= 0) return rest[i + 1];
  return rest.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}
const has = (name: string) => rest.includes(`--${name}`);
const idArg = () => {
  const id = rest[0];
  if (!id || !/^[a-z0-9-]{6,40}$/.test(id)) fail('which item? pass its id first');
  return id;
};

function fail(message: string): never {
  console.error(`feedback: ${message}`);
  process.exit(1);
}

function load(id: string): Item {
  return readItem(id) ?? fail(`no item ${id}`);
}

const NEXT: Partial<Record<Item['status'], string>> = {
  new: 'Look at the screenshot and read the words. Decide (see the skill). Then `take`, change the code, check it, and `reply`; or `decline`.',
  again:
    'The kid wants the change different: read the newest round, keep working on the same (uncommitted) change, then `reply` again.',
  kept: 'The kid likes it: run lint and tests, then `commit` with a clear message.',
  undone: 'The kid does not want it: `revert` (stashes the change, nothing is lost).',
  thinking: 'You took this one: finish the change and `reply`, or `decline`.',
  proposed: 'Waiting for the kid to decide.',
  declined: 'Waiting for the kid to hear the answer.',
};

/** Everything Claude needs about an item, with absolute paths to its files. */
function brief(item: Item) {
  const dir = itemDir(item.id);
  return {
    id: item.id,
    status: item.status,
    next: NEXT[item.status] ?? 'Nothing to do.',
    language: item.language,
    player: item.player,
    layout: item.layout,
    viewport: item.viewport,
    rounds: item.rounds.map((r, n) => ({
      mood: r.mood,
      text: r.text || undefined,
      transcript: r.transcript,
      point: r.point ?? undefined,
      screen: r.screen,
      roomId: r.roomId,
      trail: r.trail.slice(-10).map((t) => `${t.screen}: ${t.label}`),
      screenshot: r.screenshot ? join(dir, r.screenshot) : undefined,
      voice: r.voice ? join(dir, r.voice) : undefined,
      world: join(dir, `world-${n}.json`),
    })),
    replies: item.replies,
    verdicts: item.verdicts,
    git: item.git,
  };
}

const print = (v: unknown) => console.log(JSON.stringify(v, null, 2));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForNext(timeoutS: number): Promise<void> {
  const until = Date.now() + timeoutS * 1000;
  while (Date.now() < until) {
    const item = nextForClaude();
    if (item) {
      // Give the voice a moment to become text, if it is being transcribed.
      const last = item.rounds.at(-1);
      if (last?.voice && !last.transcript && transcriber()) {
        const textBy = Math.min(until, Date.now() + 90_000);
        while (Date.now() < textBy && !readItem(item.id)?.rounds.at(-1)?.transcript)
          await sleep(1000);
      }
      print(brief(readItem(item.id) ?? item));
      return;
    }
    await sleep(1000);
  }
  print({ idle: true, next: 'Nothing new. Run `wait` again to keep listening.' });
}

function addReply(item: Item, kind: Reply['kind']): void {
  const say = flag('say');
  if (!say) fail('--say "what to tell the kid" is needed');
  const reply: Reply = { at: Date.now(), kind, say };
  const screen = flag('screen');
  const roomId = flag('room');
  if (screen) reply.screen = screen;
  if (roomId) reply.roomId = roomId;
  item.replies.push(reply);
}

switch (cmd) {
  case 'wait':
    await waitForNext(Number(flag('timeout') ?? 3000));
    break;
  case 'list':
    print(
      listItems().map((i) => ({
        id: i.id,
        status: i.status,
        mood: i.rounds[0]?.mood,
        words: i.rounds[0]?.transcript ?? i.rounds[0]?.text,
      })),
    );
    break;
  case 'show':
    print(brief(load(idArg())));
    break;
  case 'take': {
    const item = load(idArg());
    if (!['new', 'again'].includes(item.status)) fail(`item is ${item.status}, not new`);
    const dirty = dirtyFiles();
    if (item.status === 'new' && dirty.length > 0 && !has('force')) {
      fail(
        `the working tree has changes (${dirty.join(', ')}). Commit or stash them first, so a "no" from the kid can be put back cleanly.`,
      );
    }
    item.git ??= { base: git('rev-parse', 'HEAD') };
    item.status = 'thinking';
    writeItem(item);
    print({ ok: true, id: item.id, status: item.status, base: item.git.base });
    break;
  }
  case 'reply': {
    const item = load(idArg());
    if (!['thinking', 'new', 'again'].includes(item.status)) fail(`item is ${item.status}`);
    if (dirtyFiles().length === 0 && !has('force')) fail('nothing changed in the code yet');
    addReply(item, 'proposal');
    item.status = 'proposed';
    writeItem(item);
    print({ ok: true, status: item.status, changed: dirtyFiles() });
    break;
  }
  case 'decline': {
    const item = load(idArg());
    if (!['thinking', 'new', 'again'].includes(item.status)) fail(`item is ${item.status}`);
    addReply(item, 'decline');
    item.status = 'declined';
    writeItem(item);
    print({ ok: true, status: item.status });
    break;
  }
  case 'commit': {
    const item = load(idArg());
    if (item.status !== 'kept') fail(`item is ${item.status}, not kept`);
    const message =
      flag('message') ?? (rest.includes('-m') ? rest[rest.indexOf('-m') + 1] : undefined);
    if (!message) fail('-m "commit message" is needed');
    if (dirtyFiles().length === 0) fail('nothing to commit');
    git('add', '-A');
    git('commit', '-q', '-m', `${message}\n\nKid feedback ${item.id}.`);
    item.git = { base: item.git?.base ?? '', commit: git('rev-parse', 'HEAD') };
    item.status = 'committed';
    writeItem(item);
    print({ ok: true, status: item.status, commit: item.git.commit });
    break;
  }
  case 'revert': {
    const item = load(idArg());
    if (item.status !== 'undone' && !has('force')) fail(`item is ${item.status}, not undone`);
    if (dirtyFiles().length > 0) {
      git('stash', 'push', '-u', '-q', '-m', `kid-feedback ${item.id}`);
      item.git = { base: item.git?.base ?? '', stash: git('rev-parse', 'stash@{0}') };
    }
    item.status = 'reverted';
    writeItem(item);
    print({ ok: true, status: item.status, stash: item.git?.stash });
    break;
  }
  case 'transcribe': {
    const item = load(idArg());
    if (!transcriber()) fail('whisper.cpp is not installed (see the skill)');
    for (const round of item.rounds) {
      if (round.voice && !round.transcript)
        round.transcript = (await transcribe(item.id, round.voice, item.language)) ?? undefined;
    }
    writeItem(item);
    print(brief(item));
    break;
  }
  case 'status': {
    const items = listItems();
    print({
      transcriber: transcriber() ?? 'not installed: voices are kept, but not turned into text',
      waitingForClaude: items
        .filter((i) => ['new', 'again', 'kept', 'undone'].includes(i.status))
        .map((i) => i.id),
      waitingForKid: items
        .filter((i) => ['proposed', 'declined'].includes(i.status))
        .map((i) => i.id),
      treeClean: dirtyFiles().length === 0,
    });
    break;
  }
  default:
    console.log(`node scripts/feedback/cli.ts <command>
  wait [--timeout S]      block until something needs Claude, print it
  list | status | show <id>
  take <id> [--force]     start on an item (needs a clean tree)
  reply <id> --say "..." [--screen scene|hub|map|characters] [--room ROOM_ID]
  decline <id> --say "..."
  commit <id> -m "..."    after the kid said keep
  revert <id>             after the kid said no (stashes the change)
  transcribe <id>`);
}
