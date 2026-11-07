// Advertisements: every thing, place and bot offers activities with need gains
// (docs/SIM.md → Choosing what to do).
import { chatOffer, offers, tidyOffer, visitOffer, type ActivityId } from '../content/activities';
import { furnitureKinds, type FurnitureKind } from '../content/furniture';
import { placedOffers } from '../content/objects';
import { town } from '../content/rooms';
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

function furnitureSpot(kind: FurnitureKind, fx: number, fy: number): { x: number; y: number } {
  const x = fx + kind.w / 2;
  if (kind.layer === 'wall') return { x, y: WALL_SPOT_Y };
  if (kind.layer === 'floor') return { x, y: fy + kind.h / 2 };
  return { x, y: Math.max(404, Math.min(520, fy + (kind.footY ?? kind.h) - 46)) };
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
  for (const building of town) {
    for (const room of building.rooms) {
      for (const f of room.furniture) {
        const kind: FurnitureKind = furnitureKinds[f.kind];
        for (const offer of offers[f.kind] ?? []) {
          // Bots only sleep in beds at home.
          if (offer.activity === 'sleep' && building.id !== bot.homeId) continue;
          const spot = furnitureSpot(kind, f.x, f.y);
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
    const offerKey = placedOffers[o.kind];
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
