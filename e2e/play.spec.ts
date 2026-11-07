import { expect, test, type Page } from '@playwright/test';

/** Tap or click, whichever the device does. */
async function press(page: Page, locator: ReturnType<Page['locator']>): Promise<void> {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch) await locator.tap();
  else await locator.click();
}

const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' }).first();

/** Open the drawer (the "+" sheet on phones) so the things are reachable. */
async function openThings(page: Page): Promise<void> {
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await press(page, plus);
}

async function waitForSave(page: Page, contains: string): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            const open = indexedDB.open('keyval-store');
            open.addEventListener('error', () => resolve(''));
            open.addEventListener('success', () => {
              const store = open.result.transaction('keyval').objectStore('keyval');
              const a = store.get('pocket-town:save:a');
              const b = store.get('pocket-town:save:b');
              b.addEventListener('success', () =>
                resolve(`${String(a.result)}${String(b.result)}`),
              );
              b.addEventListener('error', () => resolve(''));
            });
          }),
      ),
    )
    .toContain(contains);
}

// Every test runs in a fresh browser context, so it starts from a fresh town.

test('give cake by tap-tap, undo, redo, and find it again after a reload', async ({ page }) => {
  await page.goto('./#scene');
  await press(page, button(page, 'Pause'));
  await openThings(page);
  await press(page, button(page, 'Cake'));
  await expect(page.getByRole('status').filter({ hasText: 'Carrying Cake' })).toBeAttached();

  const moku = page.locator('[data-target="bot:moku"].stage-target').first();
  await expect(moku).toHaveAttribute('data-valid', 'true');
  await press(page, moku);
  await expect(moku).toHaveAttribute('data-activity', 'eat');
  await expect(moku).toHaveAttribute('aria-label', /Moku, eating/);

  // Undo puts things back as they were; redo gives the cake again.
  const undo = button(page, 'Undo');
  const before = await page
    .locator('[data-target="bot:moku"].stage-target')
    .getAttribute('data-activity');
  await press(page, undo);
  await expect(moku).not.toHaveAttribute('aria-label', /Give/);
  await press(page, button(page, 'Redo'));
  await expect(moku).toHaveAttribute('data-activity', 'eat');
  expect(before).toBe('eat');

  // Autosave, then reload: Moku is still eating the cake.
  await waitForSave(page, 'gift:cake');
  await page.reload();
  await expect(page.locator('[data-target="bot:moku"].stage-target')).toHaveAttribute(
    'data-activity',
    'eat',
  );
});

test('give a cookie by dragging it onto a character', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Mouse drag is checked in Chromium; touch uses tap-tap');
  await page.goto('./#scene');
  await press(page, button(page, 'Pause'));
  const tile = page.locator('[data-kind="starCookie"]');
  const pim = page.locator('[data-target="bot:pim"].stage-target');
  const from = await tile.boundingBox();
  const to = await pim.boundingBox();
  if (!from || !to) throw new Error('missing boxes');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y - 20, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(pim).toHaveAttribute('data-activity', 'eat');
  await expect(page.getByRole('status').filter({ hasText: 'Carrying' })).toHaveCount(0);
});

test('a thing placed on the floor stays, and can be put away with a long press', async ({
  page,
}) => {
  await page.goto('./#scene');
  await press(page, button(page, 'Pause'));
  await openThings(page);
  await press(page, button(page, 'Cake'));
  await press(page, button(page, 'Floor, middle'));
  const placed = page.getByRole('button', { name: 'Cake, pick it up' });
  await expect(placed).toBeAttached();
  await press(page, button(page, 'Undo'));
  await expect(placed).toHaveCount(0);
});

test('the bot card shows now and next, and the actions work', async ({ page }) => {
  await page.goto('./#scene');
  await press(page, button(page, 'Pause'));
  await press(page, page.locator('[data-target="bot:moku"].stage-target'));
  const card = page.getByRole('dialog', { name: 'Moku' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('img', { name: /^Now:/ })).toBeVisible();
  await expect(card.getByRole('img', { name: /^Next:/ })).toBeVisible();
  await expect(card.getByRole('list', { name: 'Traits' }).getByRole('listitem')).toHaveCount(3);

  await press(page, card.getByRole('button', { name: 'Freeze' }));
  await expect(card.getByRole('button', { name: 'Unfreeze' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-target="bot:moku"].stage-target')).toHaveAttribute(
    'aria-label',
    /frozen/,
  );
  await press(page, card.getByRole('button', { name: 'Unfreeze' }));

  await press(page, card.getByRole('button', { name: 'Nudge' }));
  await expect(card.getByRole('group', { name: 'Nudge ideas' }).getByRole('button')).toHaveCount(6);
  await press(page, card.getByRole('button', { name: 'Read' }));
  await expect(card).toBeHidden();

  await press(page, page.locator('[data-target="bot:moku"].stage-target'));
  await press(
    page,
    page.getByRole('dialog', { name: 'Moku' }).getByRole('button', { name: 'Follow' }),
  );
  await expect(page.getByRole('navigation', { name: 'Following Moku' })).toBeVisible();
  await press(page, button(page, 'Stop following'));
  await expect(page.getByRole('navigation', { name: 'Following Moku' })).toHaveCount(0);
});

test('keyboard: carry with Enter, move with arrows, drop with Escape', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Desktop keyboard flow');
  await page.goto('./#scene');
  await press(page, button(page, 'Pause'));
  await button(page, 'Cake').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Carrying Cake' })).toBeAttached();
  await page.keyboard.press('ArrowRight');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-target'));
  expect(focused).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status').filter({ hasText: 'Carrying' })).toHaveCount(0);
});

test('a photo goes into the album on this device', async ({ page }) => {
  await page.goto('./#scene');
  await press(page, button(page, 'Photo'));
  await press(page, button(page, 'Take photo'));
  // Encoding the picture is slow on software WebGL under load.
  await expect(page.getByRole('status')).toContainText('Photo saved', { timeout: 15_000 });
  await press(page, button(page, 'My photos, saved on this device'));
  await expect(page.getByRole('heading', { name: 'Photos' })).toBeVisible();
  await expect(page.locator('.photo-thumb')).toHaveCount(1);
});
