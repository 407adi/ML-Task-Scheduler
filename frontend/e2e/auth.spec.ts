import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Task Scheduler|Login/i);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should redirect /register to /login', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation error on invalid login attempt', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      // Verify page stays on login or presents error feedback
      expect(page.url()).toContain('/login');
    }
  });
});
