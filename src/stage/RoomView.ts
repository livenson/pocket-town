// A room in logical units (900 × 560): wall, floor band, skirting, and furniture.
// Characters and standing furniture share one depth-sorted layer.
import { Container, Graphics } from 'pixi.js';
import {
  furnitureKinds,
  type FurnitureKind,
  type FurnitureInstance,
  type Shape,
} from '../content/furniture';
import type { RoomDef } from '../content/rooms';
import { color, stage } from '../design/tokens';
import { ellipticalRect, hex } from './draw';

const W = stage.roomWidth;
const H = stage.roomHeight;
const FLOOR_Y = stage.floorY;
const FLOOR_BLEED = 900;

type Radii = [number, number, number, number];

/** Corner radii as a 4-tuple, optionally shrunk by `inset` (for strokes drawn inside). */
function radii(r: number | Radii | undefined, inset = 0): Radii {
  const f = (v: number) => Math.max(0, v - inset);
  if (typeof r === 'number' || r === undefined) {
    const v = f(r ?? 0);
    return [v, v, v, v];
  }
  return [f(r[0]), f(r[1]), f(r[2]), f(r[3])];
}

function drawShape(g: Graphics, s: Shape): void {
  const style = { color: hex(s.fill), alpha: s.alpha ?? 1 };
  if (s.kind === 'ellipse') {
    g.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2).fill(style);
  } else {
    const rs = radii(s.r);
    ellipticalRect(g, { x: s.x, y: s.y, w: s.w, h: s.h }, { rx: rs, ry: rs }).fill(style);
  }
  if (!s.stroke) return;
  // Strokes sit inside the shape's box, like a CSS border.
  const half = s.stroke.width / 2;
  const st = { width: s.stroke.width, color: hex(s.stroke.color), join: 'round' as const };
  if (s.kind === 'ellipse') {
    g.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2 - half, s.h / 2 - half).stroke(st);
    return;
  }
  const rs = radii(s.r, half);
  const inner = { x: s.x + half, y: s.y + half, w: s.w - 2 * half, h: s.h - 2 * half };
  ellipticalRect(g, inner, { rx: rs, ry: rs }).stroke(st);
}

export function drawFurniture(kind: FurnitureKind): Graphics {
  const g = new Graphics();
  for (const s of kind.shapes) drawShape(g, s);
  return g;
}

export class RoomView extends Container {
  /** Wall pieces: always behind characters. */
  readonly wallLayer = new Container();
  /** Rugs and other flat things: under characters. */
  readonly floorLayer = new Container();
  /** Characters and standing furniture, sorted by depth (y). */
  readonly actors = new Container();

  readonly def: RoomDef;

  constructor(def: RoomDef) {
    super();
    this.def = def;
    this.actors.sortableChildren = true;
    this.addChild(this.drawShell(def), this.wallLayer, this.floorLayer, this.actors);
    for (const f of def.furniture) this.addFurniture(f);
  }

  private drawShell(def: RoomDef): Graphics {
    const g = new Graphics();
    g.rect(0, 0, W, FLOOR_Y + 8).fill(hex(def.wall));
    if (def.stripe) {
      for (let x = 0; x < W; x += 52)
        g.rect(x, 0, 26, FLOOR_Y + 8).fill({ color: hex(def.stripe), alpha: 0.06 });
    }
    if (def.dividerX !== null)
      g.rect(def.dividerX, 0, 10, FLOOR_Y + 8).fill({ color: hex(color.ink), alpha: 0.08 });
    // The floor runs on below the room, behind the bottom docks.
    g.rect(0, FLOOR_Y, W, H - FLOOR_Y + FLOOR_BLEED).fill(hex(def.floor));
    for (let x = 118; x < W; x += 122) {
      g.rect(x, FLOOR_Y, 4, H - FLOOR_Y + FLOOR_BLEED).fill({
        color: hex(color.woodDeep),
        alpha: 0.25,
      });
    }
    g.rect(0, FLOOR_Y - 6, W, 14).fill(hex(color.wood));
    return g;
  }

  addFurniture(f: FurnitureInstance): Graphics {
    const kind: FurnitureKind = furnitureKinds[f.kind];
    const g = drawFurniture(kind);
    g.position.set(f.x, f.y);
    g.label = `furniture:${f.id}`;
    if (kind.layer === 'wall') this.wallLayer.addChild(g);
    else if (kind.layer === 'floor') this.floorLayer.addChild(g);
    else {
      g.zIndex = f.y + (kind.footY ?? kind.h);
      this.actors.addChild(g);
    }
    return g;
  }
}
