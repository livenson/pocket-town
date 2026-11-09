// What a room is for, at a glance (the home screen's cut-away house): its defining
// pieces of furniture and the icon of that kind of room. Pure data.
import type { IconName } from '../design/icons';
import { furnitureKinds, type FurnitureKind, type FurnitureKindId } from './furniture';
import { ROOM_TYPES, type RoomType } from './house';
import type { RoomDef } from './rooms';

/** Pieces that say what a room is, most telling first, with the kind of room. */
const DEFINING: [FurnitureKindId, RoomType][] = [
  ['stove', 'kitchen'],
  ['fridge', 'kitchen'],
  ['counter', 'kitchen'],
  ['bed', 'bed'],
  ['bunkBed', 'bed'],
  ['cot', 'bed'],
  ['bathtub', 'bath'],
  ['toilet', 'bath'],
  ['sink', 'bath'],
  ['toyBox', 'play'],
  ['playTent', 'play'],
  ['rockingHorse', 'play'],
  ['dollhouse', 'play'],
  ['piano', 'music'],
  ['drumKit', 'music'],
  ['musicBox', 'music'],
  ['sofa', 'living'],
  ['armchair', 'living'],
  ['tv', 'living'],
  ['table', 'kitchen'],
];

export interface RoomSummary {
  /** Up to `max` different pieces: the defining ones first, then the biggest. */
  kinds: FurnitureKindId[];
  /** The icon of the kind of room, if a defining piece says it. */
  icon: IconName | null;
}

export function roomSummary(room: RoomDef, max = 3): RoomSummary {
  const all = new Set<FurnitureKindId>(room.furniture.map((f) => f.kind));
  // Filling up with other pieces: only ones standing on the floor (no windows).
  const standing = [...all].filter((k) => {
    const kind: FurnitureKind = furnitureKinds[k];
    return kind.layer === 'stand';
  });
  const defining = DEFINING.filter(([k]) => all.has(k));
  // The kind of room most of its telling pieces say (a playroom with a bunk bed is
  // still a playroom); its pieces come first.
  const votes = new Map<RoomType, number>();
  for (const [, t] of defining) votes.set(t, (votes.get(t) ?? 0) + 1);
  let type: RoomType | undefined;
  for (const [, t] of defining) if (!type || (votes.get(t) ?? 0) > (votes.get(type) ?? 0)) type = t;
  const kinds = [
    ...defining.filter(([, t]) => t === type),
    ...defining.filter(([, t]) => t !== type),
  ]
    .map(([k]) => k)
    .slice(0, max);
  const rest = standing
    .filter((k) => !kinds.includes(k))
    .toSorted((a, b) => furnitureKinds[b].w - furnitureKinds[a].w);
  for (const k of rest) {
    if (kinds.length >= max) break;
    kinds.push(k);
  }
  return { kinds, icon: type ? ROOM_TYPES[type].icon : null };
}
