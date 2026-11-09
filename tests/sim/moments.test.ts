import { describe, expect, it } from 'vitest';
import { furnitureKinds } from '../../src/content/furniture';
import { momentFor, objectKinds, suitsThing } from '../../src/content/objects';
import { allPlaceKinds, moments } from '../../src/content/placeIdeas';
import { activityLook } from '../../src/content/activities';
import { invited } from '../../src/sim/gather';
import { History } from '../../src/sim/history';
import { run } from '../../src/sim/step';
import { createWorld, getBot } from '../../src/sim/world';

describe('places for things', () => {
  it('every place named is a real piece of furniture', () => {
    const missing = allPlaceKinds().filter((k) => !(k in furnitureKinds));
    expect(missing).toEqual([]);
  });

  it('every thing in the drawer has at least one place it suits', () => {
    const kinds = Object.keys(furnitureKinds);
    const lonely = objectKinds
      .filter((o) => !kinds.some((k) => suitsThing(o.id, k)))
      .map((o) => o.id);
    expect(lonely).toEqual([]);
  });

  it('each kind of thing has its own moment in its places', () => {
    expect(momentFor('cake', 'table')).toBe('feast');
    expect(momentFor('birthdayCake', 'table')).toBe('birthday');
    expect(momentFor('guitar', 'piano')).toBe('jam');
    expect(momentFor('storybook', 'bed')).toBe('storytime');
    expect(momentFor('pillow', 'sofa')).toBe('cosy');
    expect(momentFor('sunflower', 'window')).toBe('bloom');
    expect(momentFor('balloon', 'table')).toBe('party');
    expect(momentFor('toothbrush', 'sink')).toBe('brush');
    expect(momentFor('ball', 'toyBox')).toBe('playtime');
    expect(momentFor('cake', 'bathtub')).toBeNull();
  });

  it('every moment is something characters know how to do', () => {
    for (const m of Object.values(moments)) expect(activityLook[m.activity]).toBeDefined();
  });
});

const place = (w: ReturnType<typeof createWorld>) => {
  const roomId = w.bots[0]?.place.roomId ?? 'home-living';
  return { buildingId: 'home', roomId, x: 450, y: 470 };
};

describe('a moment: characters come to share it', () => {
  it('the nearest free characters in the room walk over and join in, with extra joy', () => {
    const w = createWorld(3);
    const h = new History();
    const where = place(w);
    for (const b of w.bots) {
      b.place = { ...where, x: 300 + Math.random() * 300 };
      b.now = null;
      b.mode = 'auto';
    }
    expect(h.do(w, { type: 'placeObject', kind: 'guitar', place: where, moment: 'jam' })).toBe(
      true,
    );
    const id = w.objects.at(-1)?.id ?? '';
    const joined = w.bots.filter((b) => b.now?.targetId === `object:${id}`);
    expect(joined.length).toBe(Math.min(moments.jam.invite, w.bots.length));
    for (const b of joined) {
      expect(b.now?.activity).toBe('music');
      expect(b.now?.byChild).toBe(true);
      expect(b.now?.gains.social).toBeGreaterThanOrEqual(25);
    }
    // They get there and play together.
    run(w, 40);
    expect(w.bots.some((b) => b.now?.targetId === `object:${id}` && b.now.phase === 'doing')).toBe(
      true,
    );
  });

  it('sleepers and characters the child is steering are left alone', () => {
    const w = createWorld(3);
    const where = place(w);
    const [a, b] = w.bots;
    if (!a || !b) throw new Error('bots');
    for (const x of [a, b]) x.place = { ...where };
    a.now = {
      activity: 'sleep',
      phase: 'doing',
      progress: 0.2,
      duration: 200,
      gains: {},
      targetId: 'spot',
    };
    b.mode = 'puppet';
    w.objects.push({ id: 'oX', kind: 'cake', place: where, placedBy: 'child' });
    const ids = invited(w, 'oX', 'feast').map((x) => x.id);
    expect(ids).not.toContain(a.id);
    expect(ids).not.toContain(b.id);
  });

  it('one undo takes back the thing and the gathering', () => {
    const w = createWorld(3);
    const h = new History();
    const where = place(w);
    const bot = w.bots[0];
    if (!bot) throw new Error('bot');
    bot.place = { ...where };
    bot.now = null;
    bot.mode = 'auto';
    const before = structuredClone(getBot(w, bot.id)?.now ?? null);
    h.do(w, { type: 'placeObject', kind: 'cake', place: where, moment: 'feast' });
    expect(getBot(w, bot.id)?.now?.activity).toBe('eat');
    h.undo(w);
    expect(w.objects.some((o) => o.kind === 'cake' && o.place.x === 450)).toBe(false);
    expect(getBot(w, bot.id)?.now ?? null).toEqual(before);
  });
});
