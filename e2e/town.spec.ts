import { expect, test, type Locator, type Page } from '@playwright/test';

async function tap(page: Page, target: Locator): Promise<void> {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch) await target.first().tap();
  else await target.first().click();
}
const b = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' });

/** Pretend the last save was made this many minutes ago (the clock moved on). */
async function ageSaves(page: Page, minutes: number): Promise<number> {
  return page.evaluate(
    (ms) =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('keyval-store');
        open.addEventListener('success', () => {
          const store = open.result.transaction('keyval', 'readwrite').objectStore('keyval');
          const keys = store.getAllKeys();
          keys.addEventListener('success', () => {
            const saves = keys.result.filter((k) => typeof k === 'string' && k.includes(':save:'));
            let done = 0;
            if (saves.length === 0) resolve(0);
            for (const k of saves) {
              const get = store.get(k);
              get.addEventListener('success', () => {
                const v: unknown = JSON.parse(String(get.result));
                if (
                  typeof v === 'object' &&
                  v !== null &&
                  'savedAt' in v &&
                  typeof v.savedAt === 'number'
                ) {
                  v.savedAt -= ms;
                }
                store.put(JSON.stringify(v), k);
                if (++done === saves.length) resolve(done);
              });
            }
          });
        });
      }),
    minutes * 60_000,
  );
}

/**
 * A floor spot nobody is standing on. Characters move about (Pim plays the music
 * box right behind the middle spot), and a tap on a character gives them the
 * thing instead of putting it on the floor.
 */
async function freeFloorSpot(page: Page): Promise<Locator> {
  const spots = page.locator('.stage-target--spot');
  const free = await spots.evaluateAll((els) =>
    els.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
    }),
  );
  // Time is paused in these tests, so nobody walks onto it before the tap.
  if (free < 0) throw new Error('every floor spot is covered by a character');
  return spots.nth(free);
}

test('coming back after a while shows the postcard, which a tap skips; the town is consistent', async ({
  page,
}) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  // Put something down so there is a save, and something to find again.
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await tap(page, b(page, 'Cake'));
  await tap(page, await freeFloorSpot(page));
  await expect(page.getByRole('button', { name: 'Cake, pick it up' })).toBeAttached();
  await expect.poll(() => ageSaves(page, 0)).toBeGreaterThan(0);

  await ageSaves(page, 45);
  await page.reload();
  const postcard = page.getByRole('button', { name: /^While you were away/ });
  await expect(postcard).toBeVisible();
  await expect(postcard.getByRole('img')).not.toHaveCount(0);
  await tap(page, postcard);
  await expect(postcard).toHaveCount(0);
  // The cake the child placed is still there; everyone is still in town.
  await expect(page.getByRole('button', { name: 'Cake, pick it up' })).toBeAttached();
  await tap(page, b(page, 'World'));
  await expect(page.getByRole('button', { name: /^Moku is / })).toBeAttached();
});

test('a short break does not show the postcard', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await tap(page, b(page, 'Cake'));
  await tap(page, await freeFloorSpot(page));
  await expect.poll(() => ageSaves(page, 0)).toBeGreaterThan(0);
  await ageSaves(page, 3);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^While you were away/ })).toHaveCount(0);
});

test('the world map shows every building, who is where, and the time of day', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'World'));
  for (const place of [
    'My house',
    'Neighbour house',
    'Café',
    'Park',
    'Library',
    'Music hall',
    'Hospital',
    'Workshop',
    'Shop',
    'Airport',
  ]) {
    await expect(
      b(page, `Go into ${place}`).or(b(page, new RegExp(`^Go into ${place}\\.`))),
    ).toBeVisible();
  }
  await expect(page.getByRole('img', { name: /^Time of day: / })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^(Moku|Pim|Lumo|Nella|Oki|Tavi) is / }),
  ).toHaveCount(6);
  await tap(page, b(page, 'Go into Café'));
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
});

test('my characters: make one with the dice, then say goodbye', async ({ page }) => {
  const pins = () => page.getByRole('button', { name: / is (at|on the way)/ });
  await page.goto('./#scene');
  await tap(page, b(page, 'Home'));
  await expect(page.locator('.hub-diorama__room').first()).toBeVisible();
  await tap(page, b(page, 'My characters'));
  await tap(page, b(page, 'Surprise character'));
  // The new character is the last card: go to the last page if there are several.
  const dots = page.getByRole('button', { name: /^Page \d+ of \d+$/ });
  if ((await dots.count()) > 0) await tap(page, dots.last());
  await tap(page, page.locator('.character-card').last());
  // Press and hold: the ring fills, then the character says goodbye.
  const hold = page.getByRole('button', { name: 'Hold to say goodbye' });
  await hold.scrollIntoViewIfNeeded();
  const box = await hold.boundingBox();
  if (!box) throw new Error('no hold button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await expect(hold).toHaveCount(0);
  // Everyone else is still in town: six on the map.
  await tap(page, b(page, 'Back'));
  await tap(page, b(page, 'World'));
  await expect(pins()).toHaveCount(6);
});

test('a building on the map opens with a real press (finger down, a pause, up)', async ({
  page,
}) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'World'));
  const cafe = b(page, 'Go into Café').or(b(page, /^Go into Café\./));
  const box = await cafe.boundingBox();
  if (!box) throw new Error('no café');
  // Pressing used to move the building out from under the finger.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
});

test('tapping someone on the map goes to watch them', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'World'));
  await tap(page, page.getByRole('button', { name: /^Moku is / }));
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: /Moku/ })).toBeVisible();
});

test('things can go on a table or a shelf, not only the floor', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await tap(page, b(page, 'Cake'));
  await expect(b(page, 'Table: put it here')).toBeAttached();
  await expect(b(page, 'Shelf: put it here')).toBeAttached();
  // Characters may stand in front of the table (a tap on them gives it to them), so
  // press the table's own button, as the keyboard does.
  await b(page, 'Table: put it here').dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Cake, pick it up' })).toBeAttached();
  // Nothing is being carried any more, so the places stop glowing.
  await expect(b(page, 'Table: put it here')).toHaveCount(0);
});

test('decorating: add a bed by tapping, turn it, take it away, and undo', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  await tap(page, b(page, 'Decorate this room'));
  // The phone keeps the catalogue in the sheet.
  const add = page.getByRole('button', { name: 'Add', exact: true });
  if (await add.isVisible()) await tap(page, add);
  await tap(page, b(page, 'Beds'));
  await tap(page, b(page, 'Bed'));
  // Tap the room (the keyboard's way: the middle of the floor).
  await page.locator('.stage-target--decor-room').dispatchEvent('click');
  const beds = page.getByRole('button', { name: /^Bed(, picked)?: / });
  await expect(beds).toHaveCount(1);
  await tap(page, b(page, 'Turn'));
  const hold = page.getByRole('button', { name: 'Hold to take it away' });
  const box = await hold.boundingBox();
  if (!box) throw new Error('no hold button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await expect(beds).toHaveCount(0);
  await tap(page, b(page, 'Undo'));
  await expect(beds).toHaveCount(1);
  await tap(page, b(page, 'Done decorating'));
  await expect(b(page, 'Decorate this room')).toBeVisible();
});

test('animals wander the map; tap one and it shares an idea', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'World'));
  const animals = page.getByRole('button', { name: /: tap to hear its idea$/ });
  await expect(animals).toHaveCount(6);
  // The duck stays on the pond, out of everyone's way: tap it.
  await page.getByRole('button', { name: 'Duck: tap to hear its idea' }).dispatchEvent('click');
  await expect(page.locator('.critter__bubble')).toHaveCount(1);
});
