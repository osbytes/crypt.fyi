import { test as base, expect, type ConsoleMessage, type Page } from '@playwright/test';

export type ConsoleEntry = {
  type: string;
  text: string;
  location?: string;
};

export type CspViolation = {
  effectiveDirective: string;
  blockedURI: string;
  violatedDirective: string;
  originalPolicy: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
};

type SmokeFixtures = {
  consoleEntries: ConsoleEntry[];
  cspViolations: CspViolation[];
};

/**
 * Console noise is collected for reporting and never fails the test by itself.
 * CSP violations are tracked separately and asserted in the smoke test — that is
 * the library-agnostic stand-in for hashing specific dependency payloads.
 */
export const test = base.extend<SmokeFixtures>({
  // Rename Playwright's fixture `use` callback — eslint-plugin-react-hooks
  // otherwise treats it as React's `use` hook.
  consoleEntries: async ({ page }, provide, testInfo) => {
    const entries: ConsoleEntry[] = [];

    const onConsole = (msg: ConsoleMessage) => {
      entries.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url
          ? `${msg.location().url}:${msg.location().lineNumber}`
          : undefined,
      });
    };
    const onPageError = (error: Error) => {
      entries.push({ type: 'pageerror', text: error.message });
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    await provide(entries);

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    const notable = entries.filter((e) =>
      ['warning', 'error', 'assert', 'pageerror'].includes(e.type),
    );

    const report = {
      total: entries.length,
      notable,
      all: entries,
    };

    await testInfo.attach('console-report.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });

    if (notable.length > 0) {
      const summary = notable.map((e) => `[${e.type}] ${e.text}`).join('\n');
      testInfo.annotations.push({
        type: 'console',
        description: `${notable.length} non-blocking console warning(s)/error(s):\n${summary}`,
      });
      // Soft report only — do not fail the test.
      console.warn(`\n[smoke] non-blocking console noise (${notable.length}):\n${summary}\n`);
    }
  },

  cspViolations: async ({ page }, provide) => {
    const violations: CspViolation[] = [];
    await installCspViolationListener(page, violations);
    await provide(violations);
  },
});

export { expect };

async function installCspViolationListener(page: Page, sink: CspViolation[]) {
  await page.exposeBinding('__cryptFyiReportCspViolation', (_source, violation: CspViolation) => {
    sink.push(violation);
  });

  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const report = (
        window as Window & {
          __cryptFyiReportCspViolation?: (v: {
            effectiveDirective: string;
            blockedURI: string;
            violatedDirective: string;
            originalPolicy: string;
            sourceFile: string;
            lineNumber: number;
            columnNumber: number;
          }) => void;
        }
      ).__cryptFyiReportCspViolation;

      report?.({
        effectiveDirective: event.effectiveDirective,
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      });
    });
  });
}
