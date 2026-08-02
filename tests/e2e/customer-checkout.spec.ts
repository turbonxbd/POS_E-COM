import { test, expect } from '@playwright/test';

test.describe('E2E Flow: Storefront -> Add to Cart -> COD Checkout -> Live Order Tracking', () => {
  test('should allow customer to order item via COD and track order status', async ({ page }) => {
    // 1. Visit Merchant Storefront
    await page.goto('http://localhost:3000/techstore');
    await expect(page.locator('h1, header')).toContainText(/TechStore/i);

    // 2. Add product to cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    await addToCartBtn.click();

    // 3. Open Cart Drawer and Proceed to Checkout
    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout"), button:has-text("Checkout")').first();
    await checkoutBtn.click();

    // 4. Fill Shipping Address Form
    await page.fill('input[name="customerName"]', 'Karim Ahmed');
    await page.fill('input[name="customerPhone"]', '01700112233');
    await page.fill('textarea[name="fullAddress"]', 'House 12, Road 5, Block B, Banani, Dhaka');

    // 5. Select Cash on Delivery (COD) and Place Order
    await page.click('input[value="COD"], button:has-text("Cash on Delivery")');
    await page.click('button:has-text("Place Order"), button:has-text("Confirm Order")');

    // 6. Assert redirection to Order Confirmation & Tracking
    await page.waitForURL(/.*track-order|.*order-success|.*orders/);
    await expect(page.locator('text=Order Received')).toBeVisible();
  });
});
