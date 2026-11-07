// Things the child (or a bot) put down in the room: a tinted token with the
// thing's icon. Food sits on a plate that never empties.
import { Container, Graphics } from 'pixi.js';
import { objectKinds } from '../content/objects';
import { color } from '../design/tokens';
import type { World } from '../sim/types';
import { hex } from './draw';
import { iconGraphics } from './iconGraphics';
import type { RoomView } from './RoomView';
import { setTargetRect } from './targets';

const SIZE = 64;
const FOOD = new Set(['food']);

function drawToken(kind: string): Container {
  const def = objectKinds.find((o) => o.id === kind);
  const c = new Container();
  const food = def ? FOOD.has(def.category) : false;
  const g = new Graphics();
  if (food) {
    g.ellipse(0, -6, SIZE * 0.62, SIZE * 0.2).fill({ color: hex(color.ink), alpha: 0.12 });
    g.ellipse(0, -10, SIZE * 0.58, SIZE * 0.2)
      .fill(0xffffff)
      .stroke({ width: 4, color: hex(color.ink) });
  } else {
    g.ellipse(0, -4, SIZE * 0.45, SIZE * 0.14).fill({ color: hex(color.ink), alpha: 0.14 });
  }
  g.roundRect(-SIZE / 2, -SIZE - (food ? 12 : 4), SIZE, SIZE, 20)
    .fill(hex(def?.tint ?? color.peach))
    .stroke({ width: 4, color: hex(color.ink) });
  const icon = iconGraphics(def?.icon ?? 'star', { size: 40, color: color.ink });
  icon.position.set(0, -SIZE / 2 - (food ? 12 : 4));
  c.addChild(g, icon);
  return c;
}

export class ObjectsView {
  private readonly tokens = new Map<string, Container>();
  private room: RoomView;

  constructor(room: RoomView) {
    this.room = room;
  }

  setRoom(room: RoomView): void {
    for (const t of this.tokens.values()) t.destroy({ children: true });
    this.tokens.clear();
    this.room = room;
  }

  update(world: World, carryingId: string | null): void {
    const roomId = this.room.def.id;
    const here = new Set<string>();
    for (const o of world.objects) {
      if (o.place.roomId !== roomId) continue;
      here.add(o.id);
      let token = this.tokens.get(o.id);
      if (!token) {
        token = drawToken(o.kind);
        this.room.actors.addChild(token);
        this.tokens.set(o.id, token);
      }
      // On furniture: drawn on its top, sorted just in front of the piece itself.
      const y = o.place.y - (o.raise ?? 0);
      token.position.set(o.place.x, y);
      token.zIndex = o.place.y + 1;
      // A thing being carried rides the pointer instead of sitting on the floor.
      token.alpha = carryingId === o.id ? 0.35 : 1;
      setTargetRect(`object:${o.id}`, { x: o.place.x - 40, y: y - 84, w: 80, h: 90 });
    }
    for (const [id, token] of this.tokens) {
      if (here.has(id)) continue;
      token.destroy({ children: true });
      this.tokens.delete(id);
    }
  }
}
