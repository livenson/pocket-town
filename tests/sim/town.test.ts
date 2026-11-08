// The town's public places: hospital, workshop, shop and airport (owner's request).
import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../../src/content/activities';
import { activityLook, offers } from '../../src/content/activities';
import { furnitureKinds } from '../../src/content/furniture';
import { giveEffects, objectKinds, placedOffers } from '../../src/content/objects';
import { allBuildings, buildingIcon, findBuilding, town } from '../../src/content/rooms';
import { setLanguage, strings } from '../../src/i18n';
import { migrate } from '../../src/persist/save';
import { collectAds } from '../../src/sim/ads';
import { catchUp } from '../../src/sim/away';
import { apply } from '../../src/sim/commands';
import { plan } from '../../src/sim/planner';
import { run } from '../../src/sim/step';
import type { Bot, World } from '../../src/sim/types';
import { createWorld, entryRoom, getBot, roomPath, routeTo } from '../../src/sim/world';

const PLACES = ['hospital', 'workshop', 'shop', 'airport'] as const;
const NEW_ACTIVITIES: ActivityId[] = ['checkup', 'tinker', 'shop', 'planes'];

const bot = (w: World, id: string): Bot => {
  const b = getBot(w, id);
  if (!b) throw new Error(id);
  return b;
};

/** Put a bot in a room, standing still with nothing to do. */
function putIn(b: Bot, roomId: string): void {
  const room = allBuildings()
    .flatMap((x) => x.rooms)
    .find((r) => r.id === roomId);
  if (!room) throw new Error(roomId);
  b.place = { buildingId: room.buildingId, roomId, x: 450, y: 460 };
  b.prev = { x: 450, y: 460 };
  b.now = null;
  b.route = [];
}

describe('the new places in town', () => {
  it('are on the map, with a sign, a name and named rooms in every language', () => {
    const missing: string[] = [];
    for (const lang of ['en', 'et', 'lv'] as const) {
      setLanguage(lang);
      for (const id of PLACES) {
        const b = findBuilding(id);
        expect(b?.kind).toBe(id);
        expect(buildingIcon[id]).toBeTruthy();
        if (!strings.buildings[id]) missing.push(`${lang}: ${id}`);
        for (const room of b?.rooms ?? [])
          if (!strings.rooms[room.id]) missing.push(`${lang}: ${room.id}`);
        for (const f of b?.rooms.flatMap((r) => r.furniture) ?? [])
          if (f.kind !== 'door' && !strings.furnitureNames[f.kind])
            missing.push(`${lang}: ${f.kind}`);
      }
      for (const a of NEW_ACTIVITIES) if (!strings.activities[a]) missing.push(`${lang}: ${a}`);
    }
    setLanguage('en');
    expect(missing).toEqual([]);
  });

  it('do not overlap on the map (every place has room for its picture)', () => {
    const spots = town.map((b) => b.map);
    for (const [i, a] of spots.entries())
      for (const b of spots.slice(i + 1))
        expect(Math.abs(a.x - b.x) > 0.15 || Math.abs(a.y - b.y) > 0.3).toBe(true);
  });

  it('have rooms joined by doors both ways, and only known furniture', () => {
    for (const id of PLACES) {
      const b = findBuilding(id);
      const first = b?.rooms[0];
      expect(first?.doors.some((d) => d.to === 'outside')).toBe(true);
      for (const room of b?.rooms ?? []) {
        expect(roomPath(first?.id ?? '', room.id)).not.toBeNull();
        const oneWay = room.doors.filter(
          (d) =>
            d.to !== 'outside' &&
            !b?.rooms.find((r) => r.id === d.to)?.doors.some((x) => x.to === room.id),
        );
        expect(oneWay).toEqual([]);
        for (const f of room.furniture) expect(furnitureKinds[f.kind]).toBeDefined();
        expect(new Set(room.furniture.map((f) => f.id)).size).toBe(room.furniture.length);
      }
    }
  });

  it('offer something to do in every room', () => {
    const idle = PLACES.flatMap((id) => findBuilding(id)?.rooms ?? [])
      .filter((room) => !room.furniture.some((f) => offers[f.kind]))
      .map((room) => room.id);
    expect(idle).toEqual([]);
  });

  it('never offer a night’s sleep (bots sleep at home); a ward bed is a rest', () => {
    const w = createWorld(3);
    const ads = collectAds(w, bot(w, 'moku')).filter((a) =>
      (PLACES as readonly string[]).includes(a.buildingId),
    );
    expect(ads.some((a) => a.activity === 'sleep')).toBe(false);
    expect(ads.some((a) => a.targetId === 'furniture:hospital-ward:hospitalBed-1')).toBe(true);
  });
});

describe('what bots do there', () => {
  it.each([
    // [activity, where the bot is, what it picks (in the same building)]
    ['checkup', 'hospital-doctor', 'furniture:hospital-doctor:examBed-1'],
    ['tinker', 'workshop-main', 'furniture:workshop-'],
    ['shop', 'shop-main', 'furniture:shop-main:'],
    ['planes', 'airport-runway', 'furniture:airport-runway:plane-1'],
  ] as const)('%s: a bot in %s finds it nearby', (activity, roomId, target) => {
    const w = createWorld(7);
    const b = bot(w, 'pim');
    putIn(b, roomId);
    const choice = plan(w, b, activity).best;
    expect(choice?.ad.buildingId).toBe(roomId.split('-')[0]);
    expect(choice?.ad.targetId.startsWith(target)).toBe(true);
  });

  it('a nudged bot walks across town to the place and does it', () => {
    const w = createWorld(11);
    for (const b of w.bots) if (b.id !== 'tavi') b.mode = 'puppet';
    const tavi = bot(w, 'tavi');
    tavi.now = null;
    apply(w, { type: 'nudge', botId: 'tavi', activity: 'tinker' });
    run(w, 5);
    const doing = () => bot(w, 'tavi').now;
    expect(doing()?.activity).toBe('tinker');
    expect(doing()?.targetId?.includes('workshop')).toBe(true);
    // Across the map, through the door, to the bench.
    run(w, 600);
    expect(tavi.place.buildingId).toBe('workshop');
    expect(w.events.some((e) => e.type === 'arrive' && e.buildingId === 'workshop')).toBe(true);
  });

  it('a check-up perks a bot up', () => {
    const w = createWorld(2);
    const b = bot(w, 'oki');
    putIn(b, 'hospital-doctor');
    for (const o of w.bots) if (o !== b) o.mode = 'puppet';
    b.needs.energy = 30;
    b.needs.social = 30;
    apply(w, { type: 'nudge', botId: 'oki', activity: 'checkup' });
    run(w, 400);
    expect(b.lastDone.checkup).toBeDefined();
    expect(b.needs.social).toBeGreaterThan(30);
  });

  it('on their own, bots go to the new places over a couple of days', () => {
    const w = createWorld(42);
    catchUp(w, 2 * 24 * 60);
    const done = new Set(
      w.bots.flatMap((b) => NEW_ACTIVITIES.filter((a) => b.lastDone[a] !== undefined)),
    );
    expect(done.size).toBeGreaterThanOrEqual(2);
  });
});

describe('play doctor, builder, shopper and pilot', () => {
  it('every new thing has a picture, something it does and a place to be used', () => {
    const fresh = objectKinds.filter((o) => ['care', 'tools', 'trips'].includes(o.category));
    expect(fresh.length).toBeGreaterThanOrEqual(12);
    const missing = fresh.filter((o) => {
      const offerKey = placedOffers[o.id];
      return !giveEffects[o.id] || !offerKey || !offers[offerKey];
    });
    expect(missing).toEqual([]);
  });

  it('a plaster gives a check-up, a hammer some tinkering, a toy plane a pilot game', () => {
    const w = createWorld(4);
    const pairs = [
      ['plaster', 'checkup'],
      ['hammer', 'tinker'],
      ['toyPlane', 'planes'],
      ['basket', 'shop'],
    ] as const;
    for (const [kind, activity] of pairs) {
      apply(w, { type: 'give', botId: 'moku', kind });
      expect(bot(w, 'moku').now?.activity).toBe(activity);
      expect(activityLook[activity].icon).toBeTruthy();
    }
  });
});

describe('saved towns', () => {
  it('an old save (schema 1, before these places) loads and can reach them', () => {
    const old = createWorld(9);
    const { houses: _before, ...json } = old;
    const file = migrate({
      schema: 1,
      savedAt: 1,
      generation: 1,
      world: json,
      ui: { roomId: 'home-living' },
    });
    expect(file).not.toBeNull();
    const w = file?.world;
    if (!w) return;
    // The places are part of the town itself, not of the save: every town has them.
    for (const id of PLACES) expect(findBuilding(id)).toBeDefined();
    const moku = bot(w, 'moku');
    const room = entryRoom('airport');
    const route = routeTo(moku.place, { buildingId: 'airport', roomId: room.id, x: 400, y: 460 });
    expect(route.some((s) => s.kind === 'travel' && s.toBuildingId === 'airport')).toBe(true);
    run(w, 50);
  });
});
