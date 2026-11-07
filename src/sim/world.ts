// Creating the world, and finding places and routes in the town.
import { starterCast } from '../content/characters';
import { allBuildings, findBuilding, findRoom, type RoomDef } from '../content/rooms';
import { stage } from '../design/tokens';
import type { Bot, Place, RouteStep, World } from './types';

/** Floor-line limits: where characters can stand, in room units. */
export const FLOOR = { minX: 60, maxX: stage.roomWidth - 60, minY: 400, maxY: 540 };
/** Depth where characters stand in a doorway. */
export const DOOR_Y = 420;

export function clampToFloor(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(FLOOR.minX, Math.min(FLOOR.maxX, x)),
    y: Math.max(FLOOR.minY, Math.min(FLOOR.maxY, y)),
  };
}

export function entryRoom(buildingId: string): RoomDef {
  const b = findBuilding(buildingId);
  const room = b?.rooms[0];
  if (!room) throw new Error(`Unknown building ${buildingId}`);
  return room;
}

/** The x of a room's front door (or its first door). */
export function frontDoorX(room: RoomDef): number {
  return (room.doors.find((d) => d.to === 'outside') ?? room.doors[0])?.x ?? FLOOR.minX;
}

/** Rooms on the way from one room to another in the same building (excluding the start). */
export function roomPath(fromRoomId: string, toRoomId: string): string[] | null {
  if (fromRoomId === toRoomId) return [];
  const seen = new Set([fromRoomId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromRoomId, path: [] }];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const room = findRoom(cur.id);
    for (const d of room?.doors ?? []) {
      if (d.to === 'outside' || seen.has(d.to)) continue;
      const path = [...cur.path, d.to];
      if (d.to === toRoomId) return path;
      seen.add(d.to);
      queue.push({ id: d.to, path });
    }
  }
  return null;
}

/** Door steps from one room to another within a building. */
function doorSteps(fromRoomId: string, toRoomId: string): RouteStep[] {
  const path = roomPath(fromRoomId, toRoomId) ?? [];
  const steps: RouteStep[] = [];
  let current = fromRoomId;
  for (const next of path) {
    const door = findRoom(current)?.doors.find((d) => d.to === next);
    const back = findRoom(next)?.doors.find((d) => d.to === current);
    if (!door || !back) break;
    steps.push({ kind: 'walk', x: door.x, y: DOOR_Y });
    steps.push({ kind: 'door', toRoomId: next, x: back.x, y: DOOR_Y });
    current = next;
  }
  return steps;
}

/** A route from where a bot is to a place anywhere in town. */
export function routeTo(from: Place, to: Place): RouteStep[] {
  const steps: RouteStep[] = [];
  if (from.buildingId === to.buildingId) {
    steps.push(...doorSteps(from.roomId, to.roomId));
  } else {
    const exitRoom = entryRoom(from.buildingId);
    steps.push(...doorSteps(from.roomId, exitRoom.id));
    steps.push({ kind: 'walk', x: frontDoorX(exitRoom), y: DOOR_Y });
    steps.push({ kind: 'travel', toBuildingId: to.buildingId });
    steps.push(...doorSteps(entryRoom(to.buildingId).id, to.roomId));
  }
  steps.push({ kind: 'walk', x: to.x, y: to.y });
  return steps;
}

export function makeBot(
  def: Pick<(typeof starterCast)[number], 'id' | 'name' | 'appearance' | 'traits' | 'homeId'>,
  place: Place,
): Bot {
  return {
    id: def.id,
    name: def.name,
    appearance: def.appearance,
    traits: def.traits,
    homeId: def.homeId,
    needs: { hunger: 75, energy: 85, fun: 65, social: 60 },
    place,
    prev: { x: place.x, y: place.y },
    facing: 1,
    moving: false,
    travel: null,
    mode: 'auto',
    modeBeforeFreeze: null,
    now: null,
    next: null,
    route: [],
    nudge: null,
    wish: null,
    lastDone: {},
    emote: null,
    happyUntil: -1,
  };
}

/** A fresh starter world. Bots begin spread around their homes with varied needs. */
export function createWorld(seed: number): World {
  const world: World = {
    version: 1,
    rng: { s: seed | 0 },
    tick: 0,
    minute: 0,
    energy: 'lively',
    bots: [],
    objects: [],
    events: [],
    nextObjectId: 1,
    nextEventSeq: 1,
    houses: [],
  };
  const starts: Record<string, Partial<Place> & { needs?: Partial<Bot['needs']> }> = {
    moku: { roomId: 'home-living', x: 356, y: 414, needs: { hunger: 40 } },
    pim: { roomId: 'home-living', x: 560, y: 470, needs: { fun: 35 } },
    oki: { roomId: 'home-bedroom', x: 300, y: 470, needs: { energy: 45 } },
    tavi: { roomId: 'home-living', x: 200, y: 500, needs: { social: 40 } },
    lumo: { roomId: 'neighbour-main', x: 400, y: 450, needs: { social: 35 } },
    nella: { roomId: 'neighbour-main', x: 640, y: 470, needs: { fun: 40 } },
  };
  for (const def of starterCast) {
    const s = starts[def.id] ?? {};
    const room = findRoom(s.roomId ?? '') ?? entryRoom(def.homeId);
    const bot = makeBot(def, {
      buildingId: room.buildingId,
      roomId: room.id,
      x: s.x ?? 400,
      y: s.y ?? 460,
    });
    Object.assign(bot.needs, s.needs ?? {});
    world.bots.push(bot);
  }
  return world;
}

export function allRooms(): RoomDef[] {
  return allBuildings().flatMap((b) => b.rooms);
}

export function getBot(world: World, id: string): Bot | undefined {
  return world.bots.find((b) => b.id === id);
}
