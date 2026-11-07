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

test('coming back after a while shows the postcard, which a tap skips; the town is consistent', async ({
  page,
}) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  // Put something down so there is a save, and something to find again.
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await tap(page, b(page, 'Cake'));
  await tap(page, b(page, 'Floor, middle'));
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
  await tap(page, b(page, 'Map'));
  await expect(page.getByRole('img', { name: /^Moku is / })).toBeAttached();
});

test('a short break does not show the postcard', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Pause'));
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await tap(page, b(page, 'Cake'));
  await tap(page, b(page, 'Floor, middle'));
  await expect.poll(() => ageSaves(page, 0)).toBeGreaterThan(0);
  await ageSaves(page, 3);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^While you were away/ })).toHaveCount(0);
});

test('the world map shows every building, who is where, and the time of day', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Map'));
  for (const place of ['My house', 'Neighbour house', 'Café', 'Park', 'Library', 'Music hall']) {
    await expect(
      b(page, `Go into ${place}`).or(b(page, new RegExp(`^Go into ${place}\\.`))),
    ).toBeVisible();
  }
  await expect(page.getByRole('img', { name: /^Time of day: / })).toBeVisible();
  await expect(page.getByRole('img', { name: /^(Moku|Pim|Lumo|Nella|Oki|Tavi) is / })).toHaveCount(
    6,
  );
  await tap(page, b(page, 'Go into Café'));
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
});

test('my characters: make one with the dice, then say goodbye', async ({ page }) => {
  const pins = () => page.getByRole('img', { name: / is (at|on the way)/ });
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
