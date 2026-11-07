import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TENS: Record<string, number> = {
  twenty: 2,
  thirty: 3,
  forty: 4,
  fifty: 5,
  sixty: 6,
  seventy: 7,
  eighty: 8,
  ninety: 9,
};

async function press(page: Page, name: string): Promise<void> {
  const button = page.getByRole('button', { name, exact: true }).first();
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch) await button.tap();
  else await button.click();
}

async function expectAccessible(page: Page, where: string): Promise<void> {
  // Let entry animations finish so colours are measured at rest.
  await page.waitForTimeout(350);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map((v) => `${where}: ${v.id} (${v.nodes.length}) ${v.help}`);
  expect(summary).toEqual([]);
}

async function passGate(page: Page): Promise<void> {
  const words = (await page.locator('.gate__prompt strong').textContent()) ?? '';
  const [tens = '', ones = 'zero'] = words.split('-');
  await press(page, String(TENS[tens]));
  await press(page, String(ONES.indexOf(ones)));
  await press(page, 'Continue');
}

test('every screen is reachable and passes axe (WCAG 2.1 AA)', async ({ page }) => {
  // About a dozen screens, each checked with axe: longer than most tests.
  test.setTimeout(150_000);
  await page.goto('./');
  await expectAccessible(page, 'splash');

  await page.getByRole('button', { name: /loading/ }).click();
  await expect(page.getByRole('heading', { name: 'How old are you?' })).toBeVisible();
  await expectAccessible(page, 'age');

  await press(page, '7');
  await expect(page.getByRole('heading', { name: 'Who is playing?' })).toBeVisible();
  await expectAccessible(page, 'profile');

  await press(page, 'New player');
  await expect(page.getByRole('button', { name: 'Roll a new character' })).toBeVisible();
  await expectAccessible(page, 'dice avatar');
  await press(page, 'Done');
  await expect(page.getByRole('heading', { name: /^Hooray, / })).toBeVisible();
  await expectAccessible(page, 'hooray');
  await press(page, 'Play');
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await press(page, 'Home');
  await expect(page.getByRole('button', { name: 'World' })).toBeVisible();
  await expectAccessible(page, 'hub');

  await press(page, 'World');
  await expect(page.getByRole('img', { name: /^Time of day/ })).toBeVisible();
  await expectAccessible(page, 'map');

  await page
    .getByRole('button', { name: /^Go into My house/ })
    .first()
    .click();
  await expect(page.getByRole('group', { name: 'Time' })).toBeVisible();
  await expectAccessible(page, 'scene');

  // Phone portrait folds the docks into the "+" sheet.
  const plus = page.getByRole('button', { name: 'Add', exact: true });
  if (await plus.isVisible()) {
    await press(page, 'Add');
    await expect(page.getByRole('dialog', { name: 'Add' })).toBeVisible();
    await expectAccessible(page, 'scene + sheet');
    await press(page, 'Close');
    await expect(page.getByRole('dialog', { name: 'Add' })).toBeHidden();
  } else {
    await expect(page.getByRole('navigation', { name: 'Characters here' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Things drawer' })).toBeVisible();
  }

  await press(page, 'Pause');
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true');

  // Photo mode opens over the stage, and closes again.
  await press(page, 'Photo');
  await expect(page.getByRole('button', { name: 'Take photo' })).toBeVisible();
  await expectAccessible(page, 'camera');
  await press(page, 'Close camera');

  await press(page, 'Edit');
  await expect(page.getByRole('heading', { name: 'Pick a spot for your house' })).toBeAttached();
  await expectAccessible(page, 'house wizard');
  await press(page, 'Back');

  await press(page, 'Home');
  await press(page, 'My characters');
  await expect(page.getByRole('heading', { name: 'My characters' })).toBeVisible();
  await expectAccessible(page, 'characters');
  await press(page, 'Home');

  await press(page, 'Settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expectAccessible(page, 'settings');
  await press(page, 'Home');

  await press(page, 'Grown-ups');
  await expect(page.getByRole('heading', { name: 'Grown-ups only' })).toBeVisible();
  await expectAccessible(page, 'gate');
  // A wrong answer clears gently and lets you try again.
  await press(page, '0');
  await press(page, '0');
  await press(page, 'Continue');
  await expect(page.getByRole('alert')).toBeVisible();
  await passGate(page);
  await expect(page.getByRole('heading', { name: 'Grown-up area' })).toBeVisible();
  await expectAccessible(page, 'grown-up');
  // Which build this is (the commit and the day), for grown-ups and bug reports.
  await expect(page.getByText(/^Version [0-9a-f]{7}, built \d{4}-\d{2}-\d{2}$/)).toBeVisible();

  await press(page, 'Component kit (for checking the design)');
  await expect(page.getByRole('heading', { name: 'Component kit' })).toBeVisible();
  await expectAccessible(page, 'kit');

  // Leaving the grown-up area locks it again.
  await press(page, 'Home');
  await press(page, 'Grown-ups');
  await expect(page.getByRole('heading', { name: 'Grown-ups only' })).toBeVisible();
});

test('every control on the kit screen is reachable with Tab', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit only tabs to buttons with a system setting');
  await page.goto('./#kit');
  await expect(page.getByRole('heading', { name: 'Component kit' })).toBeVisible();
  const controls = await page.locator('button:visible, input:visible').count();
  const reached = new Set<string>();
  for (let i = 0; i < controls + 5; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (!el.hasAttribute('data-tab-id')) el.setAttribute('data-tab-id', String(Math.random()));
      return el.getAttribute('data-tab-id');
    });
    if (id) reached.add(id);
  }
  expect(reached.size).toBeGreaterThanOrEqual(controls);
});

test('the hold button confirms by holding Space', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Keyboard focus on buttons differs in WebKit');
  await page.goto('./#kit');
  const hold = page.getByRole('button', { name: 'Hold to delete' });
  await hold.focus();
  await page.keyboard.down(' ');
  await page.waitForTimeout(900);
  await page.keyboard.up(' ');
  await expect(page.getByRole('status')).toContainText('Deleted');
});

test('calm motion stops every looping animation', async ({ page }) => {
  const looping = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
          .length,
    );
  await page.goto('./#kit');
  await expect(page.getByRole('heading', { name: 'Component kit' })).toBeVisible();
  expect(await looping()).toBeGreaterThan(0); // the hint halo pulses

  // The system "reduce motion" preference turns calm motion on.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  await expect.poll(looping).toBe(0);
});

test('calm motion setting turns on from the settings screen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /loading/ }).click();
  await press(page, '5');
  await press(page, 'New player');
  await press(page, 'Done');
  await press(page, 'Play');
  await press(page, 'Home');
  await press(page, 'Settings');
  const calm = page.getByRole('switch', { name: 'Calm motion' });
  await expect(calm).toHaveAttribute('aria-checked', 'false');
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await calm.tap();
  else await calm.click();
  await expect(calm).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  // Settings survive a reload (IndexedDB). Wait for the write to land first.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            const open = indexedDB.open('keyval-store');
            open.addEventListener('success', () => {
              const get = open.result
                .transaction('keyval')
                .objectStore('keyval')
                .get('pocket-town:settings');
              get.addEventListener('success', () => resolve(String(get.result)));
              get.addEventListener('error', () => resolve(''));
            });
            open.addEventListener('error', () => resolve(''));
          }),
      ),
    )
    .toContain('"calmMotion":true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
});

test('keyboard shortcuts work on the scene', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Desktop shortcuts are checked in Chromium');
  await page.goto('./#scene');
  await page.locator('body').focus();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press(' ');
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('f');
  await expect(page.getByRole('button', { name: 'Faster' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('m');
  await expect(page.getByRole('img', { name: /^Time of day/ })).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.getByRole('button', { name: 'World' })).toBeVisible();
});
