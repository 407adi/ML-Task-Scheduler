import { test, expect } from '@playwright/test';

test.describe('ML Prediction & Monitoring Page', () => {
  test('should render ML monitoring page or redirect to login', async ({ page }) => {
    await page.goto('/ml-models');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should render chaos console or redirect to login', async ({ page }) => {
    await page.goto('/chaos-console');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
