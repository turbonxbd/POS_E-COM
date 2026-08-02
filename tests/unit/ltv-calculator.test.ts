import { ltvCalculatorService } from '../../src/features/customer-crm/services/ltv-calculator.service';

describe('LTVCalculatorService - Unit Tests', () => {
  const merchantId = 'test-merchant-01';
  const customerId = 'test-customer-01';

  it('should initialize a new customer profile with BRONZE tier', async () => {
    const profile = await ltvCalculatorService.recalculateCustomerLTV(merchantId, customerId, 0, false);
    expect(profile).toBeDefined();
    expect(profile.membershipTier).toBe('BRONZE');
    expect(profile.lifetimeValue).toBe(0);
    expect(profile.rewardPoints).toBe(0);
  });

  it('should calculate LTV, AOV, reward points, and upgrade tier to SILVER at ৳5,000 spend', async () => {
    const profile = await ltvCalculatorService.recalculateCustomerLTV(merchantId, customerId, 5500, true);
    expect(profile.lifetimeValue).toBe(5500);
    expect(profile.totalOrdersCount).toBe(1);
    expect(profile.averageOrderValue).toBe(5500);
    expect(profile.rewardPoints).toBe(55); // 5500 / 100 = 55 points
    expect(profile.membershipTier).toBe('SILVER');
  });

  it('should upgrade membership tier to GOLD when LTV crosses ৳20,000 threshold', async () => {
    const profile = await ltvCalculatorService.recalculateCustomerLTV(merchantId, customerId, 15000, true);
    expect(profile.lifetimeValue).toBe(20500);
    expect(profile.totalOrdersCount).toBe(2);
    expect(profile.averageOrderValue).toBe(10250);
    expect(profile.membershipTier).toBe('GOLD');
  });

  it('should upgrade membership tier to PLATINUM when LTV crosses ৳50,000 threshold', async () => {
    const profile = await ltvCalculatorService.recalculateCustomerLTV(merchantId, customerId, 30000, true);
    expect(profile.lifetimeValue).toBe(50500);
    expect(profile.membershipTier).toBe('PLATINUM');
  });
});
