import { expect, test, type Locator, type Page } from '@playwright/test';

let taps = 0;
async function tap(page: Page, target: Locator): Promise<void> {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch) await target.tap();
  else await target.click();
  taps++;
}
const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' }).first();

test('first launch to first friend fed, in under 15 taps and 60 seconds', async ({ page }) => {
  taps = 0;
  const started = Date.now();
  await page.goto('./');
  await tap(page, button(page, /loading/));
  await expect(page.getByRole('heading', { name: 'How old are you?' })).toBeVisible();
  await tap(page, button(page, '6'));
  await expect(page.getByRole('heading', { name: 'Who is playing?' })).toBeVisible();
  await tap(page, button(page, 'New player'));
  await expect(button(page, 'Roll a new character')).toBeVisible();
  await tap(page, button(page, 'Roll a new character'));
  await tap(page, button(page, 'Done'));
  await expect(page.getByRole('heading', { name: /^Hooray, / })).toBeVisible();
  await tap(page, button(page, 'Play'));

  // First play: the hints lead from the "+" (phones) to the cake, to a friend, to the map.
  const hint = page.getByRole('button', { name: /^Hear the hint/ });
  await expect(hint).toBeVisible();
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) await tap(page, plus);
  await expect(page.locator('.object-tile.hint-glow')).toBeVisible();
  await tap(page, button(page, 'Cake'));
  await expect(hint).toHaveAccessibleName(/Give it to a friend/);
  await tap(page, page.locator('.stage-target--bot[data-valid]').first());
  await expect(page.locator('.stage-target--bot[data-activity="eat"]').first()).toBeAttached();
  const fedAt = Date.now();
  await expect(hint).toHaveAccessibleName(/Now try the map/);
  await expect(page.locator('.hint-glow').first()).toBeVisible();
  await tap(page, button(page, 'Map'));
  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible();

  expect(taps).toBeLessThan(15);
  expect(fedAt - started).toBeLessThan(60_000);

  // The hints never come back for this player.
  await page.getByRole('button', { name: 'My house', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Hear the hint/ })).toHaveCount(0);
});

test('a returning player picks their face and lands in their town', async ({ page }) => {
  await page.goto('./');
  await button(page, /loading/).click();
  await button(page, '10').click();
  await button(page, 'New player').click();
  await button(page, 'Done').click();
  const name = (await page.getByRole('heading', { name: /^Hooray, / }).textContent())?.replace(
    /^Hooray, |!$/g,
    '',
  );
  await button(page, 'Play').click();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  // Age 10: word labels are on.
  await expect(page.locator('html')).toHaveAttribute('data-labels', 'true');
  // Wait for the profile and the town to be saved, then come back.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Who is playing?' })).toBeVisible({
    timeout: 8000,
  });
  await button(page, `Play as ${name}`).click();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await expect(page.locator(`.stage-target--bot[aria-label^="${name},"]`).first()).toBeAttached();
});

test('the age screen has a way for grown-ups, behind the gate', async ({ page }) => {
  await page.goto('./');
  await button(page, /loading/).click();
  await button(page, 'Grown-up? Set up here').click();
  await expect(page.getByRole('heading', { name: 'Grown-ups only' })).toBeVisible();
});

test('the splash carries on by itself', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'How old are you?' })).toBeVisible({
    timeout: 8000,
  });
});
