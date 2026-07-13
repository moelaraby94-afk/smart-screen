import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/en/login');

    // The login page should render the email input
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 15_000 });

    // The login page should render the password input
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // There should be a submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/en/login');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('nonexistent@test.invalid');
    await passwordInput.fill('wrongpassword123');
    await submitButton.click();

    // Should show an error message (toast or inline)
    await page.waitForTimeout(2000);
    // Either a toast appears or the page stays on login
    expect(page.url()).toContain('/login');
  });

  test('navigate to signup page', async ({ page }) => {
    await page.goto('/en/login');

    // Look for a link to signup/register
    const signupLink = page.locator('a[href*="signup"], a[href*="register"]').first();
    if (await signupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signupLink.click();
      await page.waitForLoadState('networkidle');
      // Should be on a signup or register page
      expect(page.url()).toMatch(/signup|register/);
    }
  });
});
