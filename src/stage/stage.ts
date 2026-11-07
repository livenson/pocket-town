// The play stage: one Pixi Application for the whole app, moved into whichever
// element hosts it. Rooms are 900 × 560 logical units, scaled to fit.
import 'pixi.js/unsafe-eval'; // no eval(): keeps the Content Security Policy strict
import { Application, Container, type Ticker } from 'pixi.js';
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
import { usePlay } from '../state/play';
import { FLOOR } from '../sim/world';

/** Freeze the clock at zero (deterministic screenshots): `?still` in the URL. */
const STILL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('still');

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
      setTargetRect(`spot:${i}`, { x: x - 50, y: 396, w: 100, h: 50 }),
    );
    return room;
  }

  /** Look into another room. */
  showRoom(roomId: string): void {
    if (roomId === this.room.def.id) return;
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
    this.room.setDaylight(daylight(minuteOfDay(world.minute)));
    this.view.update(world, STILL ? 0 : sim.alpha, dt, this.time, this.prefs.calm);
    const carried = play.carrying?.source.from === 'object' ? play.carrying.source.objectId : null;
    this.objects.update(world, carried);
    this.panCamera(dt);
  }

  /** Follow-cam: switch rooms with the followed bot; keep it (or the selected bot) in view. */
  private followCamera(): void {
    const play = usePlay.getState();
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
    if (!this.fit.cropped) return;
    const { w, scale } = this.fit;
    const min = w - stageSize.roomWidth * scale;
    const target = Math.max(min, Math.min(0, w / 2 - this.focusX * scale));
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
    const scale = portrait ? Math.max(contain, (h * 0.55) / RH) : contain;
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
