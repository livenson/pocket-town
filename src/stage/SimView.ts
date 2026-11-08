// Draws the simulation's bots in the room on screen and keeps their bubbles honest:
// the intent bubble always shows what the bot is doing now (SIM.md → Legibility).
import { playSfx, speakPocketese } from '../audio/audio';
import { activityLook } from '../content/activities';
import { objectKinds } from '../content/objects';
import type { AnyIconName } from '../design/foodIcons';
import type { IconName } from '../design/icons';
import { color } from '../design/tokens';
import type { Bot, World } from '../sim/types';
import { pegWidth } from './peg/geometry';
import { gestureFor, placementOn } from './activityPose';
import { PegView, type PegActivity, type PegLook } from './peg/PegView';
import type { RoomView } from './RoomView';
import { usePlay } from '../state/play';
import { PEG_SIZE, setTargetRect } from './targets';

const EMOTE_COLOR: Partial<Record<IconName, string>> = {
  talk: color.tealDark,
  heart: color.heart,
  face: color.marigoldShadow,
  note: color.purple,
};

function wishIcon(kind: string): AnyIconName {
  return objectKinds.find((o) => o.id === kind)?.icon ?? 'star';
}

/** Each character has its own pitch range for Pocketese. */
function voicePitch(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 260 + (h % 9) * 40;
}

function poseFor(bot: Bot): PegActivity {
  if (bot.now?.phase !== 'doing') return 'idle';
  return activityLook[bot.now.activity].pose;
}

/** The character's tap area: around the figure, wherever it sits or lies. */
function targetRect(look: PegLook | null, x: number, y: number, W: number) {
  const S = PEG_SIZE;
  if (look?.at && look.stance === 'sit')
    return { x: look.at.x - W / 2 - 6, y: look.at.y - S * 0.66, w: W + 12, h: S * 0.84 };
  if (look?.at && look.stance === 'lie') {
    const dir = look.facing ?? 1;
    const x0 = dir > 0 ? look.at.x - S * 0.25 : look.at.x - S * 0.85;
    return { x: x0, y: look.at.y - S * 0.25, w: S * 1.1, h: S * 0.5 };
  }
  return { x: x - W / 2 - 6, y: y - S - 6, w: W + 12, h: S + 12 };
}

export class SimView {
  private readonly pegs = new Map<string, PegView>();
  private room: RoomView;
  private lastHappy = new Map<string, number>();
  private lastEmote = new Map<string, number>();
  private seenSeq = -1;

  constructor(room: RoomView) {
    this.room = room;
  }

  /** Switch to another room: characters are re-added as they appear there. */
  setRoom(room: RoomView): void {
    for (const peg of this.pegs.values()) {
      peg.bubble.destroy();
      peg.destroy({ children: true });
    }
    this.pegs.clear();
    this.room = room;
  }

  private pegFor(bot: Bot, index: number): PegView {
    let peg = this.pegs.get(bot.id);
    if (!peg) {
      peg = new PegView(bot.id, bot.appearance, PEG_SIZE, index * 0.37);
      this.room.actors.addChild(peg);
      this.room.bubbles.addChild(peg.bubble);
      this.pegs.set(bot.id, peg);
    }
    return peg;
  }

  /** Sounds accompany state changes, for the room on screen only. */
  private playEvents(world: World): void {
    const roomId = this.room.def.id;
    const latest = world.events.at(-1)?.seq ?? 0;
    if (this.seenSeq < 0) {
      this.seenSeq = latest; // do not replay history when the stage first opens
      return;
    }
    let chimed = false;
    let jingled = false;
    for (const e of world.events) {
      if (e.seq <= this.seenSeq) continue;
      const bot = world.bots.find((b) => b.id === e.botId);
      const inRoom = bot && !bot.travel && bot.place.roomId === roomId;
      if (e.type === 'doorbell') {
        const entry = e.buildingId && this.room.def.buildingId === e.buildingId;
        if (entry) playSfx('doorbell');
      } else if (!inRoom) {
        continue;
      } else if (
        (e.type === 'satisfied' || e.type === 'happy' || e.type === 'wishGranted') &&
        !jingled
      ) {
        playSfx('jingle');
        jingled = true;
      } else if (e.type === 'start' && !chimed) {
        const a = e.activity;
        playSfx(a === 'eat' ? 'eat' : a === 'sleep' || a === 'nap' ? 'sleep' : 'chime');
        chimed = true;
      }
    }
    this.seenSeq = latest;
  }

  /** Standing with a gesture, or sitting or lying on the piece being used. */
  private lookFor(world: World, bot: Bot, x: number): PegLook | null {
    const now = bot.now;
    if (!now || now.phase !== 'doing') return null;
    const gesture = gestureFor(now.activity);
    const target = now.targetId;
    const [what, roomId, id] = target?.split(':') ?? [];
    const f =
      what === 'furniture' && roomId === this.room.def.id
        ? this.room.def.furniture.find((p) => p.id === id)
        : undefined;
    if (f) {
      // Everyone using the same piece takes their own seat or pillow.
      const users = world.bots
        .filter((b) => b.now?.targetId === target && b.now.phase === 'doing' && !b.travel)
        .map((b) => b.id)
        .toSorted();
      const p = placementOn(f, now.activity, Math.max(0, users.indexOf(bot.id)), x, PEG_SIZE);
      if (p)
        return {
          stance: p.stance,
          gesture: p.stance === 'lie' ? 'none' : gesture,
          at: p.at,
          facing: p.facing,
          z: p.z,
        };
    }
    return { stance: 'stand', gesture };
  }

  update(world: World, alpha: number, dtS: number, timeS: number, calm: boolean): void {
    this.playEvents(world);
    const roomId = this.room.def.id;
    const here = new Set<string>();
    world.bots.forEach((bot, i) => {
      if (bot.travel || bot.place.roomId !== roomId) return;
      here.add(bot.id);
      const peg = this.pegFor(bot, i);
      const x = bot.prev.x + (bot.place.x - bot.prev.x) * alpha;
      const y = bot.prev.y + (bot.place.y - bot.prev.y) * alpha;
      const walking = bot.moving && bot.mode !== 'frozen';
      const held = walking ? null : this.lookFor(world, bot, x);
      peg.setLook(held);
      // Being moved by the child: the one on the floor fades while it rides along.
      const c = usePlay.getState().carrying;
      peg.alpha = c?.source.from === 'person' && c.source.botId === bot.id ? 0.3 : 1;
      peg.follow(x, y, bot.facing, walking, walking ? 'idle' : poseFor(bot), dtS, timeS, calm);
      // The tappable button over this character (DOM target layer).
      const W = pegWidth(PEG_SIZE);
      // The body's width, not the arms': a wider target would cover floor spots
      // and furniture beside the character.
      setTargetRect(`bot:${bot.id}`, targetRect(held, x, y, W));

      // A happy reaction (a gift, a wish come true) is a jump.
      const seen = this.lastHappy.get(bot.id) ?? -1;
      if (bot.happyUntil > seen && bot.happyUntil > world.minute) {
        peg.jump();
        this.lastHappy.set(bot.id, bot.happyUntil);
      }

      if (bot.wish) {
        peg.bubble.showCloud(wishIcon(bot.wish), color.tomatoText);
      } else if (bot.emote && bot.emote.until > world.minute) {
        peg.bubble.show(bot.emote.icon, EMOTE_COLOR[bot.emote.icon] ?? color.ink);
        if (this.lastEmote.get(bot.id) !== bot.emote.until) {
          this.lastEmote.set(bot.id, bot.emote.until);
          speakPocketese(voicePitch(bot.id));
        }
      } else if (bot.mode === 'frozen') {
        peg.bubble.show('snow', color.cornflowerShadow);
      } else if (bot.mode === 'puppet') {
        peg.bubble.show('hand', color.ink);
      } else if (bot.now) {
        const look = activityLook[bot.now.activity];
        if (look.icon) {
          peg.bubble.show(
            look.icon,
            look.color,
            bot.now.phase === 'doing' ? bot.now.progress : null,
          );
        } else {
          peg.bubble.hide();
        }
      } else {
        peg.bubble.hide();
      }
    });
    for (const [id, peg] of this.pegs) {
      if (here.has(id)) continue;
      peg.bubble.destroy();
      peg.destroy({ children: true });
      this.pegs.delete(id);
    }
  }
}
