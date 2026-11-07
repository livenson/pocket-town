// Things the child (or a bot) put down in the room: the thing's picture, standing
// on the floor (or on furniture). Food sits on a plate that never empties.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { objectKinds } from '../content/objects';
import { color } from '../design/tokens';
import type { World } from '../sim/types';
import { pictureUrl } from '../design/thingPicture';
import { hex } from './draw';
import type { RoomView } from './RoomView';
import { setTargetRect } from './targets';

const SIZE = 64;
const FOOD = new Set(['food']);
/** Drawn size of a thing's picture, in room units. */
const PICTURE = 76;

const textures = new Map<string, Promise<Texture>>();

/** The picture as a texture, made once per kind (the SVG is decoded off the page). */
function pictureTexture(art: string): Promise<Texture> {
  let t = textures.get(art);
  if (!t) {
    const img = new Image();
    img.src = pictureUrl(art);
    t = img.decode().then(() => Texture.from(img));
    textures.set(art, t);
  }
  return t;
}

function drawToken(kind: string): Container {
  const def = objectKinds.find((o) => o.id === kind);
  const c = new Container();
  const food = def ? FOOD.has(def.category) : false;
  const g = new Graphics();
  if (food) {
    // Food sits on a plate that never empties.
    g.ellipse(0, -6, SIZE * 0.62, SIZE * 0.2).fill({ color: hex(color.ink), alpha: 0.12 });
    g.ellipse(0, -10, SIZE * 0.58, SIZE * 0.2)
      .fill(0xffffff)
      .stroke({ width: 4, color: hex(color.ink) });
  } else {
    g.ellipse(0, -4, SIZE * 0.45, SIZE * 0.14).fill({ color: hex(color.ink), alpha: 0.14 });
  }
  const picture = new Sprite(Texture.EMPTY);
  picture.anchor.set(0.5, 1);
  picture.position.set(0, food ? -2 : 4);
  c.addChild(g, picture);
  if (def) {
    void pictureTexture(def.art).then((tex) => {
      if (picture.destroyed) return;
      picture.texture = tex;
      picture.width = PICTURE;
      picture.height = PICTURE;
    });
  }
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
