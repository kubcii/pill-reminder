import { test, expect } from '@playwright/test';

test.describe('Pill Reminder PWA', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Pill Reminder/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can add a pill', async ({ page }) => {
    await page.goto('/');

    const pillNameInput = page.getByPlaceholder(/pill name/i);
    const addButton = page.getByRole('button', { name: /add pill/i });

    await pillNameInput.fill('Aspirin');
    await addButton.click();

    await expect(page.getByText('Aspirin')).toBeVisible();
  });

  test('can mark pill as taken', async ({ page }) => {
    await page.goto('/');

    const pillNameInput = page.getByPlaceholder(/pill name/i);
    const addButton = page.getByRole('button', { name: /add pill/i });

    await pillNameInput.fill('Vitamin D');
    await addButton.click();

    const pillItem = page.getByText('Vitamin D').locator('..');
    const takeButton = pillItem.getByRole('button', { name: /take|taken/i });

    await takeButton.click();

    await expect(takeButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('settings toggle works', async ({ page }) => {
    await page.goto('/');

    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    const settingsPanel = page.getByRole('dialog').or(page.locator('[role="region"]'));
    await expect(settingsPanel).toBeVisible();

    await settingsButton.click();
    await expect(settingsPanel).not.toBeVisible();
  });

  test('high contrast mode applies correctly', async ({ page }) => {
    await page.goto('/');

    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    const highContrastToggle = page.getByRole('switch', { name: /high contrast/i });
    await highContrastToggle.check();

    const bodyElement = page.locator('body');
    await expect(bodyElement).toHaveClass(/high-contrast/);

    await highContrastToggle.uncheck();
    await expect(bodyElement).not.toHaveClass(/high-contrast/);
  });

  test('app manifest exists for PWA', async ({ page }) => {
    await page.goto('/');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /.+/);
  });

  test('service worker registers', async ({ page }) => {
    await page.goto('/');

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;

      await new Promise(resolve => setTimeout(resolve, 2000));

      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    });

    expect(swRegistered).toBe(true);
  });
});
