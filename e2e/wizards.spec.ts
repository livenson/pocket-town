import { expect, test, type Locator, type Page } from '@playwright/test';

async function tap(page: Page, target: Locator): Promise<void> {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch) await target.first().tap();
  else await target.first().click();
}
const b = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' });

test('build a house from scratch through every step, undo three changes, housewarming', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('./#scene');
  await tap(page, b(page, 'Home'));
  await tap(page, b(page, 'My house'));

  await tap(page, b(page, 'Plot 2'));
  await expect(b(page, 'Plot 2')).toHaveAttribute('aria-pressed', 'true');
  await tap(page, b(page, 'Choose a house shape'));
  await tap(page, b(page, 'Round house'));
  await tap(page, b(page, 'Ready to play, or decorate?'));
  await tap(page, b(page, 'Decorate it myself'));
  for (const [type, space] of [
    ['Kitchen', 1],
    ['Bedroom', 2],
    ['Play room', 3],
  ] as const) {
    await tap(page, b(page, type));
    await tap(page, page.getByRole('button', { name: new RegExp(`space ${space}$`) }));
  }
  await expect(page.getByRole('button', { name: /^Kitchen, space 1$/ })).toBeVisible();
  await tap(page, b(page, 'Paint the walls and floors'));
  await tap(page, b(page, 'Wall colour 3'));
  await tap(page, b(page, 'Add furniture'));
  await tap(page, b(page, 'Sofa'));
  await tap(page, page.getByRole('gridcell').nth(1));
  await expect(page.getByRole('gridcell', { name: /^Sofa/ })).toBeVisible();
  // Placing on a taken cell is gently refused.
  await tap(page, b(page, 'Bed'));
  await tap(page, page.getByRole('gridcell').nth(1));
  await expect(page.getByRole('gridcell', { name: /^Sofa/ })).toBeVisible();
  await tap(page, page.getByRole('gridcell').nth(3));
  await expect(page.getByRole('gridcell', { name: /^Bed/ })).toBeVisible();

  // Undo three changes: the bed, the sofa, the wall colour.
  for (let i = 0; i < 3; i++) await tap(page, b(page, 'Undo'));
  await expect(page.getByRole('gridcell', { name: /^Sofa|^Bed/ })).toHaveCount(0);
  await tap(page, b(page, 'Redo'));
  await tap(page, b(page, 'Redo'));
  await expect(page.getByRole('gridcell', { name: /^Sofa/ })).toBeVisible();

  await tap(page, b(page, 'Move in'));
  await tap(page, page.getByRole('button', { name: /^Pim:/ }));
  await tap(page, b(page, 'Front door: move in'));
  await expect(page.getByRole('button', { name: 'Pim lives here now' })).toBeVisible();

  await tap(page, b(page, 'Housewarming!'));
  await tap(page, b(page, 'Invite the neighbours'));
  await expect(b(page, 'Invite the neighbours')).toHaveAttribute('aria-pressed', 'true');
  await tap(page, b(page, 'Go inside'));
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();

  // The new house is on the map and in the hub.
  await tap(page, b(page, 'World'));
  await expect(page.getByRole('button', { name: /^Go into House 2/ })).toBeVisible();
  await tap(page, b(page, 'Home'));
  await expect(
    page.getByRole('region', { name: 'My houses' }).getByRole('button', { name: 'House 2' }),
  ).toBeVisible();
});

test('"ready to play" furnishes the house and goes straight to moving in', async ({ page }) => {
  await page.goto('./#scene');
  await tap(page, b(page, 'Home'));
  await tap(page, b(page, 'My house'));
  await tap(page, b(page, 'Plot 1'));
  await tap(page, b(page, 'Ready to play, or decorate?'));
  await tap(page, b(page, 'Ready to play: furnished and painted'));
  await expect(page.getByRole('heading', { name: 'Move in' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Kitchen, space 1$/ })).toBeVisible();
});

test('the avatar wizard: steps in any order, dice per step, undo, done', async ({ page }) => {
  await page.goto('./');
  await tap(page, page.getByRole('button', { name: /loading/ }));
  await tap(page, b(page, '10'));
  await tap(page, b(page, 'New player'));
  await tap(page, b(page, 'Pick each part'));
  for (const step of ['Hair', 'Clothes', 'Accessories', 'Body', 'Personality', 'Name']) {
    await tap(page, b(page, step));
    await expect(b(page, step)).toHaveAttribute('aria-current', 'step');
    await tap(page, b(page, 'Surprise this step'));
  }
  // Age 10: a name can be typed (it never leaves the device).
  const input = page.getByRole('textbox', { name: 'Type a name' });
  await input.fill('Zara');
  await expect(page.getByRole('img', { name: /Zara$/ })).toBeVisible();
  await tap(page, b(page, 'Undo'));
  await expect(page.getByRole('img', { name: /Zara$/ })).toHaveCount(0);
  await tap(page, b(page, 'Personality'));
  await expect(page.locator('.wizard__options [aria-pressed="true"]')).toHaveCount(3);
  await tap(page, b(page, 'Done'));
  await expect(page.getByRole('heading', { name: /^Hooray, / })).toBeVisible();
});
