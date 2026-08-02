import { test, expect } from '@playwright/test';

test.describe('E2E Flow: Merchant Login -> POS Terminal Checkout -> Thermal Receipt', () => {
  test('should log into merchant workspace and complete POS counter cash sale', async ({ page }) => {
    // 1. Visit Merchant Login Page
    await page.goto('http://localhost:3000/merchant/login');
    await page.fill('input[type="email"]', 'owner@techstorebd.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    // 2. Navigate to POS Terminal
    await page.goto('http://localhost:3000/techstore/pos');
    await expect(page.locator('h1, h2')).toContainText(/POS|Point of Sale/i);

    // 3. Add first product to cart
    const addProductBtn = page.locator('button:has-text("Add"), div[role="button"]').first();
    await addProductBtn.click();

    // 4. Click Checkout button
    const checkoutBtn = page.locator('button:has-text("Pay"), button:has-text("Checkout")').first();
    await checkoutBtn.click();

    // 5. Select Cash & Enter Tendered Amount
    await page.fill('input[type="number"]', '2000');
    await page.click('button:has-text("Complete Sale"), button:has-text("Confirm")');

    // 6. Assert thermal receipt modal display
    await expect(page.locator('text=Receipt')).toBeVisible();
  });
});
