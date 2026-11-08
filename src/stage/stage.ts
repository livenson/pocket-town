// The play stage: one Pixi Application for the whole app, moved into whichever
// element hosts it. Rooms are 900 × 560 logical units, scaled to fit.
import 'pixi.js/unsafe-eval'; // no eval(): keeps the Content Security Policy strict
import { offers } from '../content/activities';
import { fixedKinds, furnitureKinds, surfaceOf, type FurnitureKind } from '../content/furniture';
import { AccessibilitySystem, Application, Container, extensions, type Ticker } from 'pixi.js';
import { sim } from '../app/simRunner';
import { findRoom, starterRoom } from '../content/rooms';
import { breakpoints, color, stage as stageSize } from '../design/tokens';
import { minuteOfDay } from '../sim/clock';
import { useUi } from '../state/ui';
import { daylight } from './daylight';
import { StagePrefs } from './prefs';
import { ObjectsView } from './ObjectsView';
import { RoomView } from './RoomView';
import { SimView } from './SimView';
import { clearTargetRects, relayoutTargets, setTargetRect, view as targetView } from './targets';
import { useDecor } from '../state/decor';
import { usePlay } from '../state/play';
import { FLOOR } from '../sim/world';

/** Height the bottom docks take in landscape (object drawer and gap), in CSS px. */
const BOTTOM_DOCK_PX = 190;
/** The lowest room y where characters usually stand; kept clear of the drawer. */
const FEET_LINE = 500;
/** Without a GPU, drawing at full rate starves everything else. */
const SOFTWARE_MAX_FPS = 30;

/** Freeze the clock at zero (deterministic screenshots): `?still` in the URL. */
const STILL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('still');

// Pixi's own accessibility layer would add a hidden "enable accessibility" button on
// touch devices; the DOM target layer over the canvas already does that job.
extensions.remove(AccessibilitySystem);

export class Stage {
  readonly app = new Application();
  readonly world = new Container();
  room!: RoomView;
  view!: SimView;
  objects!: ObjectsView;
  /** Camera: room x to keep in view when the room is wider than the screen. */
  private focusX = stageSize.roomWidth / 2;
  private cameraX = 0;
  private fit = { w: 1, h: 1, scale: 1, cropped: false };
  private readonly prefs = new StagePrefs();
  private host: HTMLElement | null = null;
  /** The selected character last frame: a new pick takes the camera back. */
  private lastSelected: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private time = 0;

  async init(): Promise<void> {
    await this.app.init({
      preference: 'webgl',
      background: color.ground,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      autoStart: !STILL,
      width: 900,
      height: 560,
    });
    this.app.canvas.setAttribute('aria-hidden', 'true');
    this.app.canvas.dataset.testid = 'stage-canvas';
    this.app.stage.addChild(this.world);
    this.room = this.makeRoom(useUi.getState().roomId);
    this.view = new SimView(this.room);
    this.objects = new ObjectsView(this.room);
    this.drawFrame(0);
    this.app.ticker.add(this.tick);
    // No GPU, or an automated test browser: draw at most 30 times a second so input
    // and the rest of the page stay responsive.
    if (usesSoftwareRendering(this.app.canvas) || navigator.webdriver) {
      this.app.ticker.maxFPS = SOFTWARE_MAX_FPS;
    }
    // Follow room changes made elsewhere (the map, the hub).
    useUi.subscribe((s, prev) => {
      if (s.roomId !== prev.roomId) this.showRoom(s.roomId);
    });
  }

  private makeRoom(roomId: string): RoomView {
    const room = new RoomView(findRoom(roomId) ?? starterRoom);
    this.world.addChild(room);
    clearTargetRects();
    // Fixed targets: doors, the floor, three floor spots for keyboard placing.
    room.def.doors.forEach((d, i) =>
      setTargetRect(`door:${i}`, { x: d.x - 58, y: 150, w: 116, h: 212 }),
    );
    setTargetRect('floor', {
      x: 0,
      y: FLOOR.minY - 40,
      w: stageSize.roomWidth,
      h: FLOOR.maxY - FLOOR.minY + 70,
    });
    [225, 450, 675].forEach((x, i) =>
      setTargetRect(`spot:${i}`, { x: x - 50, y: 404, w: 100, h: 50 }),
    );
    // Furniture you can put things on, for drops and taps.
    for (const f of room.def.furniture) {
      const s = surfaceOf(f);
      if (s)
        // A band around the top. Characters stay above it (a tap on someone gives
        // them the thing); where nobody stands in front, the band takes it.
        setTargetRect(`surface:${f.id}`, {
          x: s.x0 - 10,
          y: s.top - 30,
          w: s.x1 - s.x0 + 20,
          h: 44,
        });
    }
    // Decorating: every piece but the doors can be picked and moved; the whole room
    // takes taps that place or move a piece.
    setTargetRect('decor-room', { x: 0, y: 0, w: stageSize.roomWidth, h: stageSize.roomHeight });
    for (const f of room.def.furniture) {
      if (fixedKinds.includes(f.kind)) continue;
      const kind: FurnitureKind = furnitureKinds[f.kind];
      const s = f.scale ?? 1;
      setTargetRect(`piece:${f.id}`, { x: f.x, y: f.y, w: kind.w * s, h: kind.h * s });
    }
    // Furniture that offers something to do: tap it to send someone there.
    for (const f of room.def.furniture) {
      const kind: FurnitureKind = furnitureKinds[f.kind];
      if (!offers[f.kind]) continue;
      const s = f.scale ?? 1;
      setTargetRect(`furniture:${f.id}`, { x: f.x, y: f.y, w: kind.w * s, h: kind.h * s });
    }
    return room;
  }

  /** Look into another room (or redraw this one after decorating). */
  showRoom(roomId: string, redraw = false): void {
    if (roomId === this.room.def.id && !redraw) return;
    const old = this.room;
    this.room = this.makeRoom(roomId);
    this.view.setRoom(this.room);
    this.objects.setRoom(this.room);
    old.destroy({ children: true });
    this.drawFrame(0);
  }

  private drawFrame(dt: number): void {
    const world = sim.world;
    const play = usePlay.getState();
    this.followCamera();
    // Decorating changed this room's furniture: draw it again.
    const def = findRoom(this.room.def.id);
    if (def && def.furniture !== this.room.def.furniture) this.showRoom(def.id, true);
    this.room.preview(useDecor.getState().preview);
    this.room.setDaylight(daylight(minuteOfDay(world.minute)));
    this.view.update(world, STILL ? 0 : sim.alpha, dt, this.time, this.prefs.calm);
    const carried = play.carrying?.source.from === 'object' ? play.carrying.source.objectId : null;
    this.objects.update(world, carried);
    this.panCamera(dt);
  }

  /** Follow-cam: switch rooms with the followed bot; keep it (or the selected bot) in view. */
  private followCamera(): void {
    const play = usePlay.getState();
    const ui = useUi.getState();
    if (play.selectedBotId !== this.lastSelected) {
      this.lastSelected = play.selectedBotId;
      if (play.selectedBotId && ui.lookX !== null) ui.setLookX(null);
    }
    // Looking left or right with the arrows, unless someone is being followed.
    if (!play.followBotId && ui.lookX !== null) {
      this.focusX = ui.lookX;
      return;
    }
    const id = play.followBotId ?? play.selectedBotId;
    const bot = id ? sim.world.bots.find((b) => b.id === id) : undefined;
    if (!bot) {
      this.focusX = stageSize.roomWidth / 2;
      return;
    }
    if (play.followBotId && !bot.travel) {
      play.addCrumb(bot.place.buildingId);
      if (bot.place.roomId !== this.room.def.id) useUi.getState().setRoom(bot.place.roomId);
    }
    if (bot.place.roomId === this.room.def.id) this.focusX = bot.place.x;
  }

  private panCamera(dt: number): void {
    const { w, scale } = this.fit;
    if (!this.fit.cropped) {
      useUi.getState().setView({
        canLeft: false,
        canRight: false,
        centreX: stageSize.roomWidth / 2,
        span: stageSize.roomWidth,
      });
      return;
    }
    const min = w - stageSize.roomWidth * scale;
    const target = Math.max(min, Math.min(0, w / 2 - this.focusX * scale));
    // Tell the look arrows what is still out of sight (where the camera is heading).
    useUi.getState().setView({
      canLeft: target < -2,
      canRight: target > min + 2,
      centreX: (w / 2 - target) / scale,
      span: w / scale,
    });
    const k = dt === 0 || this.prefs.calm ? 1 : Math.min(1, dt * 4);
    const next = this.cameraX + (target - this.cameraX) * k;
    if (Math.abs(next - this.cameraX) < 0.25) return;
    this.cameraX = next;
    this.world.position.x = Math.round(next);
    targetView.offsetX = this.world.position.x;
    relayoutTargets();
  }

  /** A picture of the stage (no menus), for the photo album. */
  async snapshot(): Promise<Blob | null> {
    const canvas = this.app.renderer.extract.canvas({ target: this.app.stage, resolution: 1 });
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  }

  private readonly tick = (ticker: Ticker): void => {
    const dt = Math.min(ticker.deltaMS, 100) / 1000;
    this.time += dt;
    this.drawFrame(dt);
  };

  attach(host: HTMLElement): void {
    this.host = host;
    host.appendChild(this.app.canvas);
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(host);
    this.layout();
    if (!STILL) this.app.start();
  }

  detach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.host?.contains(this.app.canvas)) this.host.removeChild(this.app.canvas);
    this.host = null;
    this.app.stop();
  }

  /**
   * Fit the room into the host: contain, letterboxed in the ground colour at the
   * sides, top-aligned with the floor running on behind the bottom docks.
   */
  layout(): void {
    if (!this.host) return;
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.app.renderer.resize(w, h);
    const { roomWidth: RW, roomHeight: RH } = stageSize;
    const contain = Math.min(w / RW, h / RH);
    const portrait = h > w * 1.1;
    const phonePortrait = portrait && w < breakpoints.phoneMaxWidth;
    // In portrait, "contain" would make the room tiny: fill about half the height
    // instead and crop the sides (the camera centres on the room for now).
    // Landscape: the object drawer covers the bottom, so make sure the strip of floor
    // where characters stand (down to y ≈ 500) stays above it.
    const landscapeFit = Math.min(w / RW, h / RH, (h - BOTTOM_DOCK_PX) / FEET_LINE);
    const scale = portrait ? Math.max(contain, (h * 0.55) / RH) : Math.max(0.3, landscapeFit);
    this.world.scale.set(scale);
    const cropped = RW * scale > w + 1;
    this.fit = { w, h, scale, cropped };
    this.cameraX = cropped
      ? Math.max(w - RW * scale, Math.min(0, w / 2 - this.focusX * scale))
      : Math.round((w - RW * scale) / 2);
    this.world.position.set(
      Math.round(this.cameraX),
      Math.round(
        portrait
          ? h * (phonePortrait ? 0.07 : 0.06)
          : Math.max(0, Math.min((h - RH * scale) / 2, h * 0.04)),
      ),
    );
    // Keep the DOM target layer lined up with the canvas.
    targetView.offsetX = this.world.position.x;
    targetView.offsetY = this.world.position.y;
    targetView.scale = scale;
    targetView.host = this.host;
    relayoutTargets();
    if (STILL) this.app.render();
  }
}

/** True when WebGL is drawn by the CPU (no GPU): then the stage draws less often. */
function usesSoftwareRendering(canvas: HTMLCanvasElement): boolean {
  try {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = info && gl ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    return /swiftshader|llvmpipe|software/i.test(name);
  } catch {
    return false;
  }
}

let instance: Promise<Stage> | null = null;

/** The one stage for the app, created on first use. */
export function getStage(): Promise<Stage> {
  instance ??= (async () => {
    const s = new Stage();
    await s.init();
    return s;
  })();
  return instance;
}
