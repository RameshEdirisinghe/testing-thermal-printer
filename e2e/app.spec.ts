import { test, expect } from '@playwright/test';

test.describe('Thermal Printer Diagnostics App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display title, environment banner, and initial disconnected status', async ({ page }) => {
    await expect(page.locator('text=ThermoDiagnostix')).toBeVisible();
    await expect(page.locator('text=HARDWARE DISCONNECTED')).toBeVisible();
    await expect(page.locator('text=Receipt Width:')).toBeVisible();
  });

  test('should switch between 58mm and 80mm profiles smoothly', async ({ page }) => {
    // Click 58 mm
    await page.click('button:has-text("58 mm")');
    await expect(page.locator('text=58mm (32 chars/line)')).toBeVisible();

    // Click 80 mm
    await page.click('button:has-text("80 mm")');
    await expect(page.locator('text=80mm (48 chars/line)')).toBeVisible();
  });

  test('should connect to Hardware Simulator and execute diagnostic print', async ({ page }) => {
    // Connect to virtual simulator
    await page.click('button:has-text("Activate Simulator")');
    await expect(page.locator('text=CONNECTED: Virtual Thermal POS Simulator')).toBeVisible();

    // Run Test B (Basic Text)
    const runBtn = page.locator('div:has-text("Test B: Basic Text Print Test") >> button:has-text("Run")');
    await runBtn.click();

    // Verify awaiting verification status appears
    await expect(page.locator('text=AWAITING VERIFY')).toBeVisible();

    // Click Verify Output button
    await page.click('button:has-text("Verify Output")');
    await expect(page.locator('text=Physical Output Verification')).toBeVisible();

    // Confirm passed
    await page.click('button:has-text("Confirm Passed")');
    await expect(page.locator('text=PASSED')).toBeVisible();
  });

  test('should switch between preview modes (Hex Dump, ESC/POS Parser, Raw Text)', async ({ page }) => {
    // Click Hex Dump tab
    await page.click('button:has-text("Hex Dump")');
    await expect(page.locator('text=Payload Buffer Size:')).toBeVisible();

    // Click ESC/POS Parser tab
    await page.click('button:has-text("ESC/POS Parser")');
    await expect(page.locator('text=Interpreted ESC/POS Command Sequence:')).toBeVisible();

    // Click Visual Paper
    await page.click('button:has-text("Visual Paper")');
    await expect(page.locator('text=ITEM')).toBeVisible();
  });

  test('should customize receipt layout in modal and reflect changes in preview', async ({ page }) => {
    await page.click('button:has-text("Customize Receipt Content")');
    await expect(page.locator('text=Customize Test Receipt Layout')).toBeVisible();

    // Change store name
    const storeInput = page.locator('input[value="THE ROASTERY & BAKERY"]');
    await storeInput.fill('ACME HARDWARE CO');

    await page.click('button:has-text("Apply to Preview")');
    await expect(page.locator('text=ACME HARDWARE CO')).toBeVisible();
  });
});
