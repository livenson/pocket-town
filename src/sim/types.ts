// The simulation's data. Plain JSON-friendly objects: the whole world can be saved
// and loaded as is. No DOM, no Pixi.
import type { ActivityId } from '../content/activities';
import type { Appearance } from '../content/appearance';
import type { FurnitureInstance } from '../content/furniture';
import type { HouseDef } from '../content/house';
import type { TraitId } from '../content/traits';
import type { NeedKey } from '../content/tuning';
import type { IconName } from '../design/icons';
import type { RngState } from './rng';

export type Needs = Record<NeedKey, number>;
export type BotMode = 'auto' | 'puppet' | 'frozen';
export type BotEnergy = 'lively' | 'calm' | 'paused';

/** Where something is: a room and a spot on its floor line (x) with depth (y). */
export interface Place {
  buildingId: string;
  roomId: string;
  x: number;
  y: number;
}

/** One leg of a bot's route. */
export type RouteStep =
  | { kind: 'walk'; x: number; y: number }
  /** Step through a door into another room of the same building. */
  | { kind: 'door'; toRoomId: string; x: number; y: number }
  /** Leave by the front door and cross the town map. */
  | { kind: 'travel'; toBuildingId: string };

export interface Doing {
  activity: ActivityId;
  /** furniture:<roomId>:<id> | object:<id> | bot:<id> | building:<id> | spot */
  targetId?: string;
  /** 0–1 while doing; 0 while still on the way. */
  progress: number;
  phase: 'going' | 'doing';
  /** Game minutes the activity lasts once started. */
  duration: number;
  gains: Partial<Record<NeedKey, number>>;
  /** Started by the child (give, call, nudge): shown with a happy reaction. */
  byChild?: boolean;
}

export interface Bot {
  id: string;
  name: string;
  appearance: Appearance;
  traits: [TraitId, TraitId, TraitId];
  homeId: string;
  needs: Needs;
  place: Place;
  /** Previous position, for smooth drawing between ticks. */
  prev: { x: number; y: number };
  facing: 1 | -1;
  /** True while walking this tick (for the walk animation). */
  moving: boolean;
  /** Crossing the town map between buildings (not in any room meanwhile). */
  travel: { from: string; to: string; t: number } | null;
  mode: BotMode;
  /** Mode to go back to when unfrozen. */
  modeBeforeFreeze: BotMode | null;
  now: Doing | null;
  next: { activity: ActivityId; targetId?: string } | null;
  route: RouteStep[];
  nudge: ActivityId | null;
  wish: string | null;
  /** Game minute each activity was last done (novelty bonus). */
  lastDone: Partial<Record<ActivityId, number>>;
  /** Emote bubble shown while chatting. */
  emote: { icon: IconName; until: number } | null;
  /** Happy reaction until this game minute. */
  happyUntil: number;
}

export interface PlacedObject {
  id: string;
  kind: string;
  place: Place;
  /** 'child': placed by the child, never touched by bots. 'bot': left out by a bot. */
  placedBy: 'child' | 'bot';
  /** Standing on furniture: drawn this far above `place` (which stays on the floor
   *  in front, where characters stand to use it). */
  raise?: number;
  /** Made at a workbench by a bot (only to look at; it offers nothing to do). */
  madeBy?: 'bot';
}

export type SimEventType =
  'start' | 'satisfied' | 'wish' | 'wishGranted' | 'happy' | 'doorbell' | 'arrive';

export interface SimEvent {
  /** Increases by one per event, so listeners can tell which ones they have seen. */
  seq: number;
  minute: number;
  botId: string;
  type: SimEventType;
  activity?: ActivityId;
  buildingId?: string;
  wish?: string;
}

export interface World {
  version: 1;
  rng: RngState;
  tick: number;
  /** Game minutes since the world began (day 0 starts at 08:00). */
  minute: number;
  energy: BotEnergy;
  bots: Bot[];
  objects: PlacedObject[];
  /** Most recent events, oldest first (for sounds, the ticker and the postcard). */
  events: SimEvent[];
  nextObjectId: number;
  nextEventSeq: number;
  /** Houses the child built in the house wizard. */
  houses: HouseDef[];
  /** How the child changed the map's trees and pond: decoration id → variant. */
  decor?: Record<string, number>;
  /** Rooms the child decorated: each one's whole furniture list. */
  roomEdits?: Record<string, FurnitureInstance[]>;
  /** Cars the child fixed in the garage minigame: `<roomId>:<pieceId>` → game minute. */
  fixedCars?: Record<string, number>;
}
