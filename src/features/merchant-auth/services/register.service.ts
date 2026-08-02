import { onboardingService } from '../../subscription/services/onboarding.service';

export interface RegisterMerchantPayload {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  subdomain: string;
  planId?: string;
}

export class RegisterMerchantService {
  private static instance: RegisterMerchantService | null = null;

  public static getInstance(): RegisterMerchantService {
    if (!RegisterMerchantService.instance) {
      RegisterMerchantService.instance = new RegisterMerchantService();
    }
    return RegisterMerchantService.instance;
  }

  public async registerMerchant(payload: RegisterMerchantPayload): Promise<{
    success: boolean;
    merchantId: string;
    subdomain: string;
    message: string;
  }> {
    const result = await onboardingService.registerMerchantWithPlan({
      storeName: payload.storeName,
      ownerName: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      subdomain: payload.subdomain,
      planId: payload.planId || 'plan-basic-01',
      billingCycle: 'MONTHLY',
    });

    return {
      success: result.success,
      merchantId: result.merchant?.id || `merch-${Date.now()}`,
      subdomain: payload.subdomain,
      message: result.message,
    };
  }
}

export const registerMerchantService = RegisterMerchantService.getInstance();
