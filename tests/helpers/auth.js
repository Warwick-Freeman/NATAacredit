import { request as pwRequest } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:5000';

/** Demo accounts seeded by the API (see src/pages/page-login.jsx). */
export const ACCOUNTS = {
  qualityManager: { email: 'kavya.patel@nexus360.com', password: 'demo', role: 'Quality Manager' },
  medicalDirector: { email: 'rafael.okafor@nexus360.com', password: 'demo', role: 'Medical Director' },
  technologist: { email: 'meilin.chen@nexus360.com', password: 'demo', role: 'Senior Technologist' },
};

/**
 * Fast programmatic login: hits the API directly for a token, then seeds
 * localStorage before the SPA boots so the app starts already authenticated.
 * Use this in tests that aren't about the login UI itself.
 */
export async function loginAs(page, account = ACCOUNTS.qualityManager) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${API_URL}/api/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${account.email}: ${res.status()} ${await res.text()}`);
  }
  const { token, user } = await res.json();
  await ctx.dispose();

  const session = { ...user, sites: Array.isArray(user?.sites) ? user.sites : [] };
  await page.addInitScript(
    ([t, u]) => {
      localStorage.setItem('nexus_token', t);
      localStorage.setItem('nexus_user', u);
    },
    [token, JSON.stringify(session)],
  );
}

/** Log in by driving the actual login form. Used by the auth UI spec. */
export async function loginViaForm(page, account = ACCOUNTS.qualityManager) {
  await page.goto('/');
  // Labels aren't associated with inputs (no htmlFor), so target by placeholder.
  await page.getByPlaceholder('you@nexus360.com').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: /sign in to nexus 360/i }).click();
}
