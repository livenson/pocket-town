// The play stage: one Pixi Application for the whole app, moved into whichever
// element hosts it. Rooms are 900 × 560 logical units, scaled to fit.
import 'pixi.js/unsafe-eval'; // no eval(): keeps the Content Security Policy strict
import { Application, Container, type Ticker } from 'pixi.js';
import { sim } from '../app/simRunner';
import { findRoom, starterRoom, type DoorDef } from '../content/rooms';
import { breakpoints, color, stage as stageSize } from '../design/tokens';
import { minuteOfDay } from '../sim/clock';
import { useUi } from '../state/ui';
import { daylight } from './daylight';
import { StagePrefs } from './prefs';
import { RoomView } from './RoomView';
import { SimView } from './SimView';

/** Freeze the clock at zero (deterministic screenshots): `?still` in the URL. */
const STILL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('still');

export class Stage {
  readonly app = new Application();
  readonly world = new Container();
  room!: RoomView;
  view!: SimView;
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
    this.drawFrame(0);
    this.app.ticker.add(this.tick);
    // Follow room changes made elsewhere (the map, the hub).
    useUi.subscribe((s, prev) => {
      if (s.roomId !== prev.roomId) this.showRoom(s.roomId);
    });
  }

  private makeRoom(roomId: string): RoomView {
    const room = new RoomView(findRoom(roomId) ?? starterRoom);
    room.onDoor = (door) => this.openDoor(door);
    this.world.addChild(room);
    return room;
  }

  private openDoor(door: DoorDef): void {
    if (door.to === 'outside') useUi.getState().go('map');
    else useUi.getState().setRoom(door.to);
  }

  /** Look into another room. */
  showRoom(roomId: string): void {
    if (roomId === this.room.def.id) return;
    const old = this.room;
    this.room = this.makeRoom(roomId);
    this.view.setRoom(this.room);
    old.destroy({ children: true });
    this.drawFrame(0);
  }

  private drawFrame(dt: number): void {
    const world = sim.world;
    this.room.setDaylight(daylight(minuteOfDay(world.minute)));
    this.view.update(world, STILL ? 0 : sim.alpha, dt, this.time, this.prefs.calm);
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
    this.world.position.set(
      Math.round((w - RW * scale) / 2),
      Math.round(
        portrait
          ? h * (phonePortrait ? 0.07 : 0.06)
          : Math.max(0, Math.min((h - RH * scale) / 2, h * 0.04)),
      ),
    );
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
