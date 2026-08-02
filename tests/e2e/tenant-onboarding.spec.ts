import { test, expect } from '@playwright/test';

test.describe('E2E Flow: Public Landing -> Subscription Purchase -> Tenant Provisioning', () => {
  test('should register a new SME merchant and provision store subdomain', async ({ page }) => {
    // 1. Visit landing page pricing section
    await page.goto('http://localhost:3000/#pricing');
    await expect(page.locator('h1, h2')).toContainText(/SME|Merchant|Platform/i);

    // 2. Click "Get Started" on Professional Plan
    const selectPlanBtn = page.locator('button:has-text("Get Started"), a:has-text("Get Started")').first();
    await selectPlanBtn.click();

    // 3. Fill registration form
    await page.fill('input[name="storeName"]', 'Gadget Central BD');
    await page.fill('input[name="ownerName"]', 'Tanvir Hossain');
    await page.fill('input[name="email"]', `gadgetcentral_${Date.now()}@gmail.com`);
    await page.fill('input[name="phone"]', '01711223344');
    await page.fill('input[name="subdomain"]', `gadgetcentral${Date.now().toString().slice(-4)}`);
    await page.fill('input[name="password"]', 'Password@123');

    // 4. Submit Registration
    await page.click('button[type="submit"]');

    // 5. Assert redirection to merchant onboarding/dashboard
    await page.waitForURL(/.*dashboard|.*onboarding|.*merchant/);
    await expect(page).toHaveURL(/.*dashboard|.*onboarding|.*merchant/);
  });
});
