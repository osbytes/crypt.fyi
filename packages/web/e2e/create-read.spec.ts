import { test, expect } from './fixtures';

const SECRET = `playwright-smoke-${Date.now()}`;

/** Violations that break the product or the reason we added this smoke. */
const isBlockingCspViolation = (directive: string) =>
  directive === 'connect-src' || directive.startsWith('style-src');

test.describe('create and read smoke', () => {
  test('creates a secret and reads it back under production CSP', async ({
    page,
    consoleEntries,
    cspViolations,
  }, testInfo) => {
    // Ensure console fixture is active for the whole test (reporting is non-blocking).
    void consoleEntries;

    await page.goto('/new');

    await page.getByLabel('Secret content').fill(SECRET);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('heading', { name: 'Secret Created!' })).toBeVisible();

    // Unmask before reading the value (success fields are masked by default).
    await page.getByRole('button', { name: 'Show secret URL' }).first().click();
    const combinedUrl = await page.locator('#combined-url').inputValue();
    expect(combinedUrl).toMatch(/\/[^/#?\s]+#/);

    // Exercise toast styling paths that often trip style-src.
    await page.getByRole('button', { name: 'Copy secret URL' }).first().click();

    await page.goto(combinedUrl);
    await page.getByRole('button', { name: 'View Secret' }).click();

    await expect(page.getByLabel('Secret content')).toHaveText(SECRET);

    const blocking = cspViolations.filter((v) => isBlockingCspViolation(v.effectiveDirective));
    const reported = cspViolations.filter((v) => !isBlockingCspViolation(v.effectiveDirective));

    if (reported.length > 0) {
      const summary = reported
        .map(
          (v) =>
            `[${v.effectiveDirective}] blocked ${v.blockedURI || '(inline)'} @ ${v.sourceFile}:${v.lineNumber}`,
        )
        .join('\n');
      testInfo.annotations.push({
        type: 'csp',
        description: `${reported.length} non-blocking CSP violation(s):\n${summary}`,
      });
      console.warn(`\n[smoke] non-blocking CSP noise (${reported.length}):\n${summary}\n`);
    }

    expect(
      blocking,
      blocking.length
        ? `Blocking CSP violation(s) under production policy:\n${blocking
            .map(
              (v) =>
                `- ${v.effectiveDirective} blocked ${v.blockedURI || '(inline)'} @ ${v.sourceFile}:${v.lineNumber}`,
            )
            .join('\n')}\nUpdate nginx/nginx.conf (or fix the offender), then re-run.`
        : '',
    ).toEqual([]);
  });
});
