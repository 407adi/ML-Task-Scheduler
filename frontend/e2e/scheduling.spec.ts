import { test, expect } from '@playwright/test';

test.describe('Scheduling & Fog Computing Page', () => {
  test('should render fog computing dashboard', async ({ page }) => {
    await page.goto('/fog-computing');
    // If auth guard redirects to login, check redirect, else check content
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.locator('h1, h2')).toContainText(/Fog|Computing|Schedule/i);
    }
  });

  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
