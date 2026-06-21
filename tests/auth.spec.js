import { test, expect } from './helpers/fixtures';
import { ACCOUNTS, loginViaForm } from './helpers/auth';

test.describe('Authentication', () => {
  test('shows the login screen when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('you@nexus360.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in to nexus 360/i })).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('you@nexus360.com').fill('nobody@nexus360.com');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.getByRole('button', { name: /sign in to nexus 360/i }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    // Still on the login screen.
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('a demo-account shortcut fills the form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: ACCOUNTS.qualityManager.email }).click();
    await expect(page.getByPlaceholder('you@nexus360.com')).toHaveValue(ACCOUNTS.qualityManager.email);
    await expect(page.locator('input[type="password"]')).toHaveValue('demo');
  });

  test('logs in with valid credentials and lands on the app shell', async ({ page }) => {
    await loginViaForm(page, ACCOUNTS.qualityManager);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.nav-item', { hasText: 'Home' })).toBeVisible();
    // Session persisted for subsequent reloads.
    expect(await page.evaluate(() => localStorage.getItem('nexus_token'))).toBeTruthy();
  });

  test('signs out back to the login screen', async ({ page }) => {
    await loginViaForm(page, ACCOUNTS.qualityManager);
    await expect(page.locator('.sidebar')).toBeVisible();
    await page.locator('.sign-out-btn').click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('nexus_token'))).toBeNull();
  });
});
