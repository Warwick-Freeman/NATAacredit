import { test, expect } from './helpers/fixtures';
import { loginAs } from './helpers/auth';
import { MODULES, navItem } from './helpers/modules';

test.describe('Module navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/');
    // Wait past the "Loading…" splash and confirm the API was reachable.
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.getByText('Could not reach API')).toHaveCount(0);
  });

  for (const mod of MODULES) {
    test(`opens "${mod.label}" and renders without errors`, async ({ page, errors }) => {
      const item = navItem(page, mod.label);

      // aasm-only modules (ISR, Workbooks) may not be present under ASA standard.
      if ((await item.count()) === 0) {
        test.skip(mod.aasmOnly === true, `"${mod.label}" not available under the active standard`);
      }

      await item.first().click();

      // Route changed: nav item is active and the breadcrumb reflects the page.
      await expect(item.first()).toHaveClass(/active/);
      await expect(page.locator('.crumbs .here')).toHaveText(mod.crumb);

      // Page content rendered, not an error/blank screen.
      await expect(page.locator('.main')).toBeVisible();
      await expect(page.getByText('Could not reach API')).toHaveCount(0);

      expect(errors, `Console/page errors on "${mod.label}":\n${errors.join('\n')}`).toEqual([]);
    });
  }

  test('walks through every module in one session without errors', async ({ page, errors }) => {
    for (const mod of MODULES) {
      const item = navItem(page, mod.label);
      if ((await item.count()) === 0) continue; // skip standard-gated modules
      await item.first().click();
      await expect(item.first()).toHaveClass(/active/);
      await expect(page.locator('.crumbs .here')).toHaveText(mod.crumb);
    }
    expect(errors, `Errors during full walk:\n${errors.join('\n')}`).toEqual([]);
  });
});
