import { registerMerchantService } from '../../src/features/merchant-auth/services/register.service';
import { loginMerchantService } from '../../src/features/merchant-auth/services/login.service';

describe('Merchant Auth Integration Tests', () => {
  const email = `testmerchant_${Date.now()}@gmail.com`;
  const password = 'Password@123';
  const storeName = 'TechStore Testing';

  it('should register a new merchant successfully', async () => {
    const res = await registerMerchantService.registerMerchant({
      storeName,
      ownerName: 'Test Owner',
      email,
      phone: '+8801700112233',
      password,
      subdomain: `teststore${Date.now().toString().slice(-4)}`,
    });

    expect(res.success).toBe(true);
    expect(res.merchantId).toBeDefined();
  });

  it('should authenticate merchant and issue session token upon correct credentials', async () => {
    const loginRes = await loginMerchantService.loginMerchant({
      email,
      password,
    });

    expect(loginRes.success).toBe(true);
    expect(loginRes.token).toBeDefined();
  });

  it('should reject authentication attempt upon invalid password', async () => {
    await expect(
      loginMerchantService.loginMerchant({
        email,
        password: 'WrongPassword123',
      })
    ).rejects.toThrow();
  });
});
