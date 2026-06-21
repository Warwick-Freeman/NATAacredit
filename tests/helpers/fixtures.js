import { test as base, expect } from '@playwright/test';

/**
 * Console / page-error noise we deliberately ignore. These come from
 * third-party libs (AG Grid, SurveyJS) or the browser itself and aren't
 * regressions in the app under test. Add patterns here as needed.
 */
const IGNORED = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /AG Grid: License/i, // ag-grid community edition watermark warning
  /Download the React DevTools/i,
];

const isIgnored = (text) => IGNORED.some((re) => re.test(text));

/**
 * Extends the base test with an `errors` fixture: an array that collects
 * console.error output and uncaught page exceptions for the test's page.
 * Assert it stays empty (after ignoring known noise) at the end of a test.
 */
export const test = base.extend({
  errors: async ({ page }, use) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnored(msg.text())) {
        errors.push(`console.error: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      if (!isIgnored(err.message)) errors.push(`pageerror: ${err.message}`);
    });
    await use(errors);
  },
});

export { expect };
