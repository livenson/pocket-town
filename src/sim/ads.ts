// Advertisements: every thing, place and bot offers activities with need gains
// (docs/SIM.md → Choosing what to do).
import { chatOffer, offers, tidyOffer, visitOffer, type ActivityId } from '../content/activities';
import { furnitureKinds, type FurnitureInstance, type FurnitureKind } from '../content/furniture';
import { placedOffers } from '../content/objects';
import { allBuildings } from '../content/rooms';
import type { NeedKey } from '../content/tuning';
import type { Bot, Place, World } from './types';
import { clampToFloor, entryRoom } from './world';

export interface Ad {
  targetId: string;
  activity: ActivityId;
  gains: Partial<Record<NeedKey, number>>;
  duration: number;
  capacity: number;
  /** Where users stand, one spot per capacity slot. */
  spots: { x: number; y: number }[];
  buildingId: string;
  roomId: string;
  /** For chat: the other bot. */
  partnerId?: string;
}

const SLOT_SPACING = 72;
const WALL_SPOT_Y = 412;

function spotsAround(x: number, y: number, capacity: number): { x: number; y: number }[] {
  return Array.from({ length: capacity }, (_, i) =>
    clampToFloor(x + (i - (capacity - 1) / 2) * SLOT_SPACING, y),
  );
}

function furnitureSpot(
  kind: FurnitureKind,
  fx: number,
  fy: number,
  scale = 1,
  standing = false,
): { x: number; y: number } {
  const x = fx + (kind.w * scale) / 2;
  const foot = fy + ('footY' in kind && kind.footY !== undefined ? kind.footY : kind.h) * scale;
  if (kind.layer === 'wall' && !standing) return { x, y: WALL_SPOT_Y };
  if (kind.layer === 'floor') return { x, y: fy + (kind.h * scale) / 2 };
  return { x, y: Math.max(404, Math.min(520, foot - 46 * Math.max(0.6, scale))) };
}

/** What a character does on a piece of furniture the child put them on. */
export interface FurnitureUse {
  targetId: string;
  activity: ActivityId;
  gains: Partial<Record<NeedKey, number>>;
  duration: number;
  /** Where they stand to use it (the stage then seats them, or tucks them in). */
  spot: { x: number; y: number };
}

/**
 * The piece of furniture under a room point that offers something to do (the one
 * in front, if they overlap), or null. A bed put to use by the child is a nap:
 * nights' sleep stays the characters' own choice.
 */
export function furnitureUseAt(
  roomId: string,
  furniture: readonly FurnitureInstance[],
  x: number,
  y: number,
): FurnitureUse | null {
  let best: FurnitureInstance | null = null;
  let bestZ = -Infinity;
  for (const f of furniture) {
    const kind: FurnitureKind = furnitureKinds[f.kind];
    if (kind.layer !== 'stand' || !offers[f.kind]?.length) continue;
    const s = f.scale ?? 1;
    if (x < f.x || x > f.x + kind.w * s || y < f.y || y > f.y + kind.h * s) continue;
    const z = f.y + (kind.footY ?? kind.h) * s;
    if (z > bestZ) {
      best = f;
      bestZ = z;
    }
  }
  const offer = best ? offers[best.kind]?.[0] : undefined;
  if (!best || !offer) return null;
  const kind: FurnitureKind = furnitureKinds[best.kind];
  const s = best.scale ?? 1;
  const spot = furnitureSpot(kind, best.x, best.y, best.scale, best.standing);
  const sleep = offer.activity === 'sleep';
  return {
    targetId: `furniture:${roomId}:${best.id}`,
    activity: sleep ? 'nap' : offer.activity,
    gains: sleep ? { energy: 30 } : offer.gains,
    duration: sleep ? 45 : offer.duration,
    spot: { x: Math.min(best.x + kind.w * s, Math.max(best.x, x)), y: spot.y },
  };
}

/** Bots that could start chatting now. */
export function availableForChat(bot: Bot): boolean {
  return (
    bot.mode === 'auto' &&
    bot.travel === null &&
    (bot.now === null || bot.now.activity === 'wander') &&
    bot.nudge === null
  );
}

/** Every advertisement in town, for one bot (it never sees its own chat ad). */
export function collectAds(world: World, bot: Bot): Ad[] {
  const ads: Ad[] = [];
  for (const building of allBuildings()) {
    for (const room of building.rooms) {
      for (const f of room.furniture) {
        const kind: FurnitureKind = furnitureKinds[f.kind];
        for (const offer of offers[f.kind] ?? []) {
          // Bots only sleep in beds at home.
          if (offer.activity === 'sleep' && building.id !== bot.homeId) continue;
          const spot = furnitureSpot(kind, f.x, f.y, f.scale, f.standing);
          ads.push({
            targetId: `furniture:${room.id}:${f.id}`,
            ...offer,
            spots: spotsAround(spot.x, spot.y, offer.capacity),
            buildingId: building.id,
            roomId: room.id,
          });
        }
      }
    }
    if (building.kind === 'house' && building.id !== bot.homeId) {
      const room = entryRoom(building.id);
      ads.push({
        targetId: `building:${building.id}`,
        ...visitOffer,
        spots: spotsAround(470, 470, visitOffer.capacity),
        buildingId: building.id,
        roomId: room.id,
      });
    }
  }

  for (const o of world.objects) {
    // Something a bot made at the workbench is only there to look at (and tidy).
    const offerKey = o.madeBy === 'bot' ? undefined : placedOffers[o.kind];
    for (const offer of offerKey ? (offers[offerKey] ?? []) : []) {
      ads.push({
        targetId: `object:${o.id}`,
        ...offer,
        spots: spotsAround(o.place.x, o.place.y, offer.capacity).map((s, i) => ({
          x: s.x + (i % 2 === 0 ? -40 : 40),
          y: s.y,
        })),
        buildingId: o.place.buildingId,
        roomId: o.place.roomId,
      });
    }
    // Only things a bot left out can be tidied, never what the child placed.
    if (o.placedBy === 'bot') {
      ads.push({
        targetId: `tidy:${o.id}`,
        ...tidyOffer,
        spots: [{ x: o.place.x, y: o.place.y }],
        buildingId: o.place.buildingId,
        roomId: o.place.roomId,
      });
    }
  }

  for (const other of world.bots) {
    if (other.id === bot.id || !availableForChat(other)) continue;
    const side = other.place.x > 450 ? -70 : 70;
    ads.push({
      targetId: `bot:${other.id}`,
      ...chatOffer,
      spots: [clampToFloor(other.place.x + side, other.place.y)],
      buildingId: other.place.buildingId,
      roomId: other.place.roomId,
      partnerId: other.id,
    });
  }
  return ads;
}

/** How many bots are using or heading to a target. */
export function usersOf(world: World, targetId: string, except?: string): number {
  return world.bots.filter((b) => b.id !== except && b.now?.targetId === targetId).length;
}

export function spotPlace(ad: Ad, slot: number): Place {
  const spot = ad.spots[Math.min(slot, ad.spots.length - 1)] ?? { x: 450, y: 460 };
  return { buildingId: ad.buildingId, roomId: ad.roomId, x: spot.x, y: spot.y };
}
