import { test, expect } from './fixtures';
import { assertNoBlockingCsp, createTextSecret } from './helpers';

test.describe('create and read smoke', () => {
  test('creates, reads, and burns under production CSP', async ({
    page,
    consoleEntries,
    cspViolations,
  }, testInfo) => {
    // Ensure console fixture is active for the whole test (reporting is non-blocking).
    void consoleEntries;

    const secret = `playwright-smoke-${Date.now()}`;
    // Default create path enables burn-after-reading.
    const combinedUrl = await createTextSecret(page, secret);

    // Exercise toast styling paths that often trip style-src.
    await page.getByRole('button', { name: 'Copy secret URL' }).first().click();

    await page.goto(combinedUrl);
    await page.getByRole('button', { name: 'View Secret' }).click();

    await expect(page.getByLabel('Secret content')).toHaveText(secret);
    await expect(page.getByText(/permanently deleted/i)).toBeVisible();

    // Same-URL goto can no-op in Chromium; leave and return to remount View.
    await page.goto('/new');
    await page.goto(combinedUrl);
    await expect(page.getByRole('heading', { name: 'Secret Not Found' })).toBeVisible();

    await assertNoBlockingCsp(cspViolations, testInfo);
  });
});
