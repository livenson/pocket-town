// M2 demo cast: five characters doing things in place and one walking back and
// forth. Milestone M3 replaces this with the bot simulation.
import { starterCast } from '../content/characters';
import { color } from '../design/tokens';
import type { IconName } from '../design/icons';
import { PegView, type PegActivity } from './peg/PegView';
import type { RoomView } from './RoomView';

interface Placement {
  id: string;
  x: number;
  y: number;
  activity: PegActivity;
  facing: 1 | -1;
  intent: { icon: IconName; color: string; progress?: boolean } | null;
}

const PLACEMENTS: Placement[] = [
  {
    id: 'oki',
    x: 92,
    y: 452,
    activity: 'idle',
    facing: 1,
    intent: { icon: 'home', color: color.ink },
  },
  {
    id: 'moku',
    x: 356,
    y: 414,
    activity: 'idle',
    facing: 1,
    intent: { icon: 'fork', color: color.tomatoText, progress: true },
  },
  {
    id: 'pim',
    x: 548,
    y: 474,
    activity: 'dance',
    facing: -1,
    intent: { icon: 'note', color: color.purple },
  },
  {
    id: 'lumo',
    x: 700,
    y: 414,
    activity: 'idle',
    facing: 1,
    intent: { icon: 'talk', color: color.tealDark },
  },
  {
    id: 'nella',
    x: 806,
    y: 414,
    activity: 'idle',
    facing: -1,
    intent: { icon: 'heart', color: color.heart },
  },
  { id: 'tavi', x: 160, y: 500, activity: 'walk', facing: 1, intent: null },
];

const WALK_LEFT = 160;
const WALK_RIGHT = 470;

export class DemoCast {
  readonly pegs: PegView[] = [];
  private readonly progressPegs: PegView[] = [];
  private walker: PegView | null = null;

  constructor(room: RoomView) {
    PLACEMENTS.forEach((p, i) => {
      const def = starterCast.find((c) => c.id === p.id);
      if (!def) return;
      const peg = new PegView(def.id, def.appearance, 122, i * 0.37);
      peg.position.set(p.x, p.y);
      peg.face(p.facing);
      peg.setActivity(p.activity === 'walk' ? 'idle' : p.activity);
      if (p.intent) peg.showIntent(p.intent.icon, p.intent.color, p.intent.progress ? 0.35 : null);
      if (p.intent?.progress) this.progressPegs.push(peg);
      if (p.activity === 'walk') this.walker = peg;
      room.actors.addChild(peg);
      this.pegs.push(peg);
    });
  }

  update(dtS: number, simDtS: number, timeS: number, simTimeS: number, calm: boolean): void {
    const walker = this.walker;
    if (walker && !walker.walking && simDtS > 0) {
      walker.walkTo(walker.x < (WALK_LEFT + WALK_RIGHT) / 2 ? WALK_RIGHT : WALK_LEFT);
    }
    for (const peg of this.pegs) peg.update(peg === walker ? simDtS : dtS, timeS, calm);
    for (const peg of this.progressPegs) peg.bubble.setProgress(0.35 + ((simTimeS * 0.06) % 0.65));
  }
}
