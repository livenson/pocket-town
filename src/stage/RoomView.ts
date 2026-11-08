// A room in logical units (900 × 560): wall, floor band, skirting, and furniture.
// Characters and standing furniture share one depth-sorted layer.
import { Container, Graphics } from 'pixi.js';
import {
  furnitureKinds,
  paintedShapes,
  type FurnitureKind,
  type FurnitureInstance,
  type Shape,
} from '../content/furniture';
import type { RoomDef } from '../content/rooms';
import { flyingPlane } from '../content/townFurniture';
import { runwayPlaneAt, windowPlaneAt } from './planes';
import type { Daylight } from './daylight';
import { color, stage } from '../design/tokens';
import { ellipticalRect, hex } from './draw';

const W = stage.roomWidth;
const H = stage.roomHeight;
const FLOOR_Y = stage.floorY;
const FLOOR_BLEED = 900;
/** The runway plane is drawn at this size (it is far off, at the back of the apron). */
const RUNWAY_PLANE_SCALE = 0.36;
const RUNWAY_WHEELS_Y = 392;

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

export function drawFurniture(kind: FurnitureKind, paint?: string): Graphics {
  const g = new Graphics();
  for (const s of paintedShapes(kind, paint)) drawShape(g, s);
  return g;
}

/** Put a piece's drawing where the instance says: position, size, turn and depth. */
function placePiece(g: Container, f: FurnitureInstance, kind: FurnitureKind): void {
  const scale = f.scale ?? 1;
  g.position.set(f.x, f.y);
  // Turned pieces flip around their own middle.
  g.scale.set(f.flip ? -scale : scale, scale);
  if (f.flip) g.position.x = f.x + kind.w * scale;
  const footY = 'footY' in kind && kind.footY !== undefined ? kind.footY : kind.h;
  g.zIndex = f.y + footY * scale;
}

export class RoomView extends Container {
  /** Wall pieces: always behind characters. */
  readonly wallLayer = new Container();
  /** Rugs and other flat things: under characters. */
  readonly floorLayer = new Container();
  /** Characters and standing furniture, sorted by depth (y). */
  readonly actors = new Container();
  /** Darkness at night, over everything in the room. */
  private readonly dim = new Graphics();
  /** Bubbles stay bright above the night dimming. */
  readonly bubbles = new Container();
  readonly def: RoomDef;
  /** Sky seen through windows (white, tinted by time of day). */
  private readonly panes: Graphics[] = [];
  private readonly moons: Graphics[] = [];
  private readonly clouds: Graphics[] = [];
  private sky: Graphics | null = null;
  /** Each piece's drawing, so decorating can move one without redrawing the room. */
  private readonly pieces = new Map<string, { g: Container; f: FurnitureInstance }>();
  /** The airport: a plane taking off and landing on the runway (between rugs and actors). */
  private runwayPlane: Container | null = null;
  private runwayShadow: Graphics | null = null;
  /** Small planes passing behind big windows, and how wide each window is. */
  private readonly windowPlanes: { plane: Container; w: number; h: number }[] = [];
  /** What is shown while dragging: a piece moved (or a new one) under the finger. */
  private previewing: { f: FurnitureInstance; ghost: Container | null } | null = null;

  constructor(def: RoomDef) {
    super();
    this.def = def;
    this.actors.sortableChildren = true;
    this.dim.rect(-2000, -2000, W + 4000, H + 4000).fill(hex(color.night));
    this.dim.alpha = 0;
    this.dim.eventMode = 'none';
    this.addChild(
      this.drawShell(def),
      this.wallLayer,
      this.floorLayer,
      ...(def.runway ? [this.makeTraffic()] : []),
      this.actors,
      this.dim,
      this.bubbles,
    );
    for (const f of def.furniture) this.addFurniture(f);
  }

  private drawShell(def: RoomDef): Container {
    const shell = new Container();
    const g = new Graphics();
    if (def.indoor) {
      g.rect(0, 0, W, FLOOR_Y + 8).fill(hex(def.wall));
    } else {
      // Outdoors the wall is the sky itself, tinted by time of day.
      this.sky = new Graphics().rect(0, 0, W, FLOOR_Y + 8).fill(0xffffff);
      this.sky.tint = hex(def.wall);
      shell.addChild(this.sky);
    }
    if (def.stripe) {
      for (let x = 0; x < W; x += 52)
        g.rect(x, 0, 26, FLOOR_Y + 8).fill({ color: hex(def.stripe), alpha: 0.06 });
    }
    if (def.dividerX !== null)
      g.rect(def.dividerX, 0, 10, FLOOR_Y + 8).fill({ color: hex(color.ink), alpha: 0.08 });
    // The floor runs on below the room, behind the bottom docks.
    g.rect(0, FLOOR_Y, W, H - FLOOR_Y + FLOOR_BLEED).fill(hex(def.floor));
    if (def.indoor) {
      for (let x = 118; x < W; x += 122) {
        g.rect(x, FLOOR_Y, 4, H - FLOOR_Y + FLOOR_BLEED).fill({
          color: hex(color.woodDeep),
          alpha: 0.25,
        });
      }
      g.rect(0, FLOOR_Y - 6, W, 14).fill(hex(color.wood));
    }
    shell.addChild(g);
    return shell;
  }

  private makeTraffic(): Container {
    const c = new Container();
    c.eventMode = 'none';
    this.runwayShadow = new Graphics().ellipse(0, 0, 90, 9).fill({ color: hex(color.ink) });
    this.runwayShadow.alpha = 0.18;
    const plane = drawFurniture(flyingPlane);
    // Turn round its wheels; nose to the left (it takes off towards the door).
    plane.pivot.set(flyingPlane.w / 2, flyingPlane.footY ?? flyingPlane.h);
    plane.scale.set(-RUNWAY_PLANE_SCALE, RUNWAY_PLANE_SCALE);
    this.runwayPlane = plane;
    c.addChild(this.runwayShadow, plane);
    return c;
  }

  /** Planes coming and going. Calm motion: the plane waits on the runway. */
  animate(seconds: number, calm: boolean): void {
    if (this.runwayPlane && this.runwayShadow) {
      const p = runwayPlaneAt(calm ? 0 : seconds);
      this.runwayPlane.visible = !p.away;
      this.runwayPlane.position.set(p.x, p.y);
      this.runwayPlane.rotation = p.tilt;
      const lift = Math.max(0, RUNWAY_WHEELS_Y - p.y);
      this.runwayShadow.visible = !p.away && lift < 200;
      this.runwayShadow.position.set(p.x, RUNWAY_WHEELS_Y + 4);
      this.runwayShadow.scale.set(Math.max(0.3, 1 - lift / 250));
    }
    for (const w of this.windowPlanes) {
      const u = calm ? null : windowPlaneAt(seconds);
      w.plane.visible = u !== null;
      if (u !== null) w.plane.position.set(u * w.w, w.h * (0.42 - 0.12 * u));
    }
  }

  private drawWindow(kind: FurnitureKind): Container {
    const c = new Container();
    const pane = new Graphics().roundRect(8, 8, kind.w - 16, kind.h - 16, 18).fill(0xffffff);
    pane.tint = hex(color.sky);
    const moon = new Graphics().circle(kind.w * 0.72, kind.h * 0.3, 16).fill(hex(color.marigold));
    moon.circle(kind.w * 0.72 + 8, kind.h * 0.3 - 6, 14).cut();
    moon.visible = false;
    const cloud = new Graphics().roundRect(28, 102, 60, 22, 11).fill(0xffffff);
    // A big window at the airport: now and then a plane passes, seen through the glass.
    let passing: Container | null = null;
    if (kind.id === 'bigWindow') {
      const plane = new Container();
      const drawing = drawFurniture(flyingPlane);
      drawing.pivot.set(flyingPlane.w / 2, flyingPlane.h / 2);
      drawing.scale.set(0.16);
      drawing.rotation = -0.08;
      plane.addChild(drawing);
      plane.visible = false;
      const glass = new Graphics().roundRect(8, 8, kind.w - 16, kind.h - 16, 18).fill(0xffffff);
      passing = new Container();
      passing.addChild(glass, plane);
      passing.mask = glass;
      this.windowPlanes.push({ plane, w: kind.w, h: kind.h });
    }
    const frame = new Graphics()
      .roundRect(4, 4, kind.w - 8, kind.h - 8, 22)
      .stroke({ width: 8, color: hex(color.ink) })
      .rect(kind.w / 2 - 4, 0, 8, kind.h)
      .fill(hex(color.ink));
    c.addChild(pane, moon, cloud);
    if (passing) c.addChild(passing);
    c.addChild(frame);
    this.panes.push(pane);
    this.moons.push(moon);
    this.clouds.push(cloud);
    return c;
  }

  /** True when this door piece is the room's way outside. */
  private isFrontDoor(f: FurnitureInstance, kind: FurnitureKind): boolean {
    if (kind.id !== 'door') return false;
    const centre = f.x + (kind.w * (f.scale ?? 1)) / 2;
    return this.def.doors.some((d) => d.to === 'outside' && Math.abs(d.x - centre) < 8);
  }

  /**
   * The front door looks different from doors between rooms by shape, not only
   * colour: a round window with the sky in it, and a doormat on the floor.
   */
  private drawFrontDoor(kind: FurnitureKind, paint?: string): Container {
    const c = new Container();
    c.addChild(drawFurniture(kind, paint ?? color.teal));
    const cx = kind.w / 2;
    const cy = 56;
    const pane = new Graphics().circle(cx, cy, 26).fill(0xffffff);
    pane.tint = hex(color.sky);
    const frame = new Graphics()
      .circle(cx, cy, 26)
      .stroke({ width: 6, color: hex(color.ink) })
      .rect(cx - 2, cy - 26, 4, 52)
      .fill(hex(color.ink))
      .rect(cx - 26, cy - 2, 52, 4)
      .fill(hex(color.ink));
    const mat = new Graphics()
      .roundRect(-10, kind.h - 2, kind.w + 20, 16, 8)
      .fill(hex(color.tomato))
      .stroke({ width: 4, color: hex(color.ink) });
    for (let x = 6; x < kind.w; x += 18)
      mat.rect(x, kind.h + 2, 8, 8).fill({ color: 0xffffff, alpha: 0.55 });
    c.addChild(pane, frame, mat);
    this.panes.push(pane);
    return c;
  }

  addFurniture(f: FurnitureInstance): Container {
    const kind: FurnitureKind = furnitureKinds[f.kind];
    const g: Container =
      kind.id === 'window' || kind.id === 'bigWindow'
        ? this.drawWindow(kind)
        : this.isFrontDoor(f, kind)
          ? this.drawFrontDoor(kind, f.paint)
          : drawFurniture(kind, f.paint);
    g.label = `furniture:${f.id}`;
    if (kind.layer === 'wall' && !f.standing) this.wallLayer.addChild(g);
    else if (kind.layer === 'floor') this.floorLayer.addChild(g);
    else this.actors.addChild(g);
    placePiece(g, f, kind);
    this.pieces.set(f.id, { g, f });
    return g;
  }

  /**
   * While dragging: show `f` (an existing piece moved, or a new one as a see-through
   * ghost); null puts everything back. Cheap to call every frame with the same value.
   */
  preview(f: FurnitureInstance | null): void {
    if (this.previewing?.f === f) return;
    if (this.previewing) {
      const { f: old, ghost } = this.previewing;
      ghost?.destroy({ children: true });
      const piece = this.pieces.get(old.id);
      if (piece) placePiece(piece.g, piece.f, furnitureKinds[piece.f.kind]);
      this.previewing = null;
    }
    if (!f) return;
    const piece = this.pieces.get(f.id);
    if (piece) {
      placePiece(piece.g, f, furnitureKinds[f.kind]);
      this.previewing = { f, ghost: null };
      return;
    }
    const ghost = this.addFurniture(f);
    this.pieces.delete(f.id);
    ghost.alpha = 0.6;
    this.previewing = { f, ghost };
  }

  setDaylight(light: Daylight): void {
    const sky = hex(light.sky);
    for (const p of this.panes) p.tint = sky;
    for (const m of this.moons) m.visible = light.night;
    for (const c of this.clouds) c.visible = !light.night && light.dim < 0.1;
    if (this.sky) this.sky.tint = this.def.indoor ? 0xffffff : sky;
    this.dim.alpha = light.dim;
  }
}
