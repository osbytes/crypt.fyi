import { test, expect } from './fixtures';
import { assertNoBlockingCsp } from './helpers';

const isDark = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

test.describe('theme', () => {
  test('follows the OS by default and reacts to OS changes', async ({
    page,
    cspViolations,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/about');
    expect(await isDark(page)).toBe(true);
    await expect(page.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => isDark(page)).toBe(false);

    await assertNoBlockingCsp(cspViolations, testInfo);
  });

  test('an explicit choice beats the OS, survives reload, and can return to system', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/about');

    await page.getByRole('button', { name: 'Light' }).click();
    await expect.poll(() => isDark(page)).toBe(false);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f6f7');

    await page.reload();
    expect(await isDark(page)).toBe(false);

    await page.getByRole('button', { name: 'System' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
  });

  test('applies the stored theme before the app bundle renders', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    // Block the bundle: only public/theme-init.js can have set the class.
    await page.route('**/assets/*.js', (route) => route.abort());
    await page.goto('/about');
    expect(await isDark(page)).toBe(true);
  });
});
