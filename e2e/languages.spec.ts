import { expect, test } from '@playwright/test';

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

test('grown-ups can switch the language behind the gate, and the gate follows it', async ({
  page,
}) => {
  await page.goto('./#scene');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Grown-ups', exact: true }).click();
  const words = (await page.locator('.gate__prompt strong').textContent()) ?? '';
  const [tens = '', ones = 'zero'] = words.split('-');
  await page.getByRole('button', { name: String(TENS[tens]), exact: true }).click();
  await page.getByRole('button', { name: String(ONES.indexOf(ones)), exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByRole('button', { name: 'Eesti', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Täiskasvanute ala' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'et');
  await expect(page.getByRole('button', { name: 'Eesti', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Latviešu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pieaugušo zona' })).toBeVisible();

  // The gate now writes its number in Latvian words.
  await page.getByRole('button', { name: 'Mājas', exact: true }).click();
  await page.getByRole('button', { name: 'Pieaugušajiem', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tikai pieaugušajiem' })).toBeVisible();
  await expect(page.locator('.gate__prompt strong')).toHaveText(
    /desmit|padsmit|viens|divi|trīs|četri|pieci|seši|septiņi|astoņi|deviņi/,
  );
});

test('the device language is used by default', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'et-EE' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.getByRole('button', { name: /Pocket Town laeb/ })).toBeVisible();
  await context.close();
});
