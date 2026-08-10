import { expect, type Page, type TestInfo } from '@playwright/test';
import type { CspViolation } from './fixtures';

/** Violations that break the product or the reason we run under production CSP. */
export const isBlockingCspViolation = (directive: string) =>
  directive === 'connect-src' || directive.startsWith('style-src');

export async function assertNoBlockingCsp(
  cspViolations: CspViolation[],
  testInfo: TestInfo,
): Promise<void> {
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
    console.warn(`\n[e2e] non-blocking CSP noise (${reported.length}):\n${summary}\n`);
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
}

/** Combined share URL: path, optional `?p=true`, then `#` decryption key. */
export const combinedSecretUrlPattern = /\/[^/#?\s]+(?:\?[^#]*)?#/;

export async function createTextSecret(
  page: Page,
  secret: string,
  options: { password?: string } = {},
): Promise<string> {
  await page.goto('/new');

  await page.getByLabel('Secret content').fill(secret);
  if (options.password) {
    await page.getByLabel('Password', { exact: true }).fill(options.password);
  }

  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Secret Created!' })).toBeVisible();

  // Success fields are masked by default.
  await page.getByRole('button', { name: 'Show secret URL' }).first().click();
  const combinedUrl = await page.locator('#combined-url').inputValue();
  expect(combinedUrl).toMatch(combinedSecretUrlPattern);

  return combinedUrl;
}
