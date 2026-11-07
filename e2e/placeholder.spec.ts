import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    pocketTownSoundsStarted: number[];
  }
}

/** Record the length of every audio buffer the page starts playing. */
async function recordSounds(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.pocketTownSoundsStarted = [];
    // Wrapping the prototype method on purpose; `this` is rebound in the wrapper.
    // oxlint-disable-next-line typescript/unbound-method
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
      window.pocketTownSoundsStarted.push(this.buffer?.length ?? 0);
      return start.apply(this, args);
    };
  });
}

async function pressPlay(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Play' });
  const hasTouch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (hasTouch) await button.tap();
  else await button.click();
}

test('shows the placeholder in the Pocket Town identity', async ({ page }) => {
  await page.goto('./');
  const title = page.getByRole('heading', { level: 1, name: 'Pocket Town' });
  await expect(title).toBeVisible();

  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(bg).toBe('rgb(255, 230, 207)'); // apricot ground

  await page.evaluate(() => document.fonts.ready);
  expect(await title.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('800');
  expect(await page.evaluate(() => document.fonts.check('800 48px "Baloo 2"'))).toBe(true);

  const button = page.getByRole('button', { name: 'Play' });
  const box = await button.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(76);
  expect(box?.height).toBeGreaterThanOrEqual(76);
});

test('the Play button makes a sound', async ({ page }) => {
  await recordSounds(page);
  await page.goto('./');
  await pressPlay(page);
  // The unlock step plays a 1-sample silent buffer; the pop itself is much longer.
  await expect
    .poll(() => page.evaluate(() => window.pocketTownSoundsStarted.filter((n) => n > 100).length))
    .toBeGreaterThanOrEqual(1);
});

test('makes no third-party requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? '').origin;
  const foreign: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) foreign.push(url);
  });
  await page.goto('./');
  await pressPlay(page);
  await page.waitForLoadState('networkidle');
  expect(foreign).toEqual([]);
});

test('ships a Content Security Policy that only allows our own origin', async ({ page }) => {
  await page.goto('./');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("connect-src 'self'");
});

test.describe('installable PWA', () => {
  test('manifest and service worker are in place', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service worker checks run in Chromium');
    await page.goto('./');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const response = await page.request.get(manifestHref ?? '');
    expect(await response.json()).toMatchObject({
      name: 'Pocket Town',
      short_name: 'Pocket Town',
      display: 'standalone',
      start_url: '/pocket-town/',
      scope: '/pocket-town/',
      background_color: '#FFE6CF',
      theme_color: '#EF4B2F',
    });
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/pocket-town\/$/);
  });

  test('Chrome reports no installability errors', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Installability is a Chromium check');
    await page.goto('./');
    await page.evaluate(async () => navigator.serviceWorker.ready);
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: { errorId: string }[];
    };
    expect(installabilityErrors).toEqual([]);
  });

  test('works offline after the first visit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Offline check runs in Chromium');
    await page.goto('./');
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload(); // now controlled by the service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Pocket Town' })).toBeVisible();
    await context.setOffline(false);
  });
});
