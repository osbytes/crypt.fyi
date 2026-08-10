import { test, expect } from './fixtures';
import { assertNoBlockingCsp, createTextSecret } from './helpers';

test.describe('password-protected secret', () => {
  test('creates with password and unlocks under production CSP', async ({
    page,
    consoleEntries,
    cspViolations,
  }, testInfo) => {
    void consoleEntries;

    const secret = `playwright-password-${Date.now()}`;
    const password = `pw-${Date.now()}`;
    const combinedUrl = await createTextSecret(page, secret, { password });

    expect(combinedUrl).toContain('p=true');

    await page.goto(combinedUrl);
    await expect(page.getByRole('heading', { name: 'Enter Password' })).toBeVisible();

    await page.locator('#secret-password').fill(password);
    await page.getByRole('button', { name: 'Unlock secret' }).click();

    await expect(page.getByLabel('Secret content')).toHaveText(secret);

    await assertNoBlockingCsp(cspViolations, testInfo);
  });
});
