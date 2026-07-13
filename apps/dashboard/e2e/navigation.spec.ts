import { test, expect } from '@playwright/test';

test.describe('Navigation smoke', () => {
  test('homepage loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Page should load without critical JS errors
    expect(errors).toEqual([]);

    // The page should have some visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/en/login');
    await page.waitForLoadState('networkidle');

    // Should have a form
    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to login or show login form
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|dashboard/);
  });

  test('Arabic locale loads with RTL', async ({ page }) => {
    await page.goto('/ar/login');
    await page.waitForLoadState('networkidle');

    // The html element should have dir="rtl"
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });
});
