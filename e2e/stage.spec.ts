import { expect, test, type Page } from '@playwright/test';

const canvas = (page: Page) => page.locator('canvas[data-testid="stage-canvas"]');

async function canvasHash(page: Page): Promise<string> {
  const png = await canvas(page).screenshot();
  let h = 0;
  for (const b of png) h = (h * 31 + b) | 0;
  return String(h);
}

test('the stage draws the room without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./#scene');
  await expect(canvas(page)).toBeVisible();
  const box = await canvas(page).boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(errors).toEqual([]);
});

test('characters move: the picture changes over time', async ({ page }) => {
  await page.goto('./#scene');
  await expect(canvas(page)).toBeVisible();
  await page.waitForTimeout(400);
  const a = await canvasHash(page);
  await page.waitForTimeout(700);
  const b = await canvasHash(page);
  expect(a).not.toBe(b);
});

test('the map leads into every building', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./#scene');
  await expect(canvas(page)).toBeVisible();
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  for (const name of [
    'Café',
    'Park',
    'Library',
    'Music hall',
    'Hospital',
    'Workshop',
    'Shop',
    'Airport',
    'Neighbour house',
    'My house',
  ]) {
    const mapButton = page.getByRole('button', { name: 'World', exact: true });
    if (touch) await mapButton.tap();
    else await mapButton.click();
    const building = page.getByRole('button', { name: new RegExp(`^Go into ${name}`) }).first();
    if (touch) await building.tap();
    else await building.click();
    await expect(canvas(page)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('room matches the reference picture', async ({ page }) => {
  test.skip(
    process.platform !== 'linux',
    'Baselines are made on Linux (CI); see npm run e2e:screenshots',
  );
  await page.goto('./?still&seed=1#scene');
  await expect(canvas(page)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(canvas(page)).toHaveScreenshot('room.png', { maxDiffPixelRatio: 0.01 });
});
