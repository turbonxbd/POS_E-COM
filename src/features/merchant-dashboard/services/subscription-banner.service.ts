import { onboardingService } from '../../subscription/services/onboarding.service';
import { planService } from '../../platform-admin/services/plan.service';

export interface SubscriptionQuotaStatus {
  productsUsed: number;
  maxProducts: number;
  productsPercentage: number;
  ordersUsed: number;
  maxOrders: number;
  ordersPercentage: number;
  usersUsed: number;
  maxUsers: number;
  usersPercentage: number;
}

export interface SubscriptionBannerOverview {
  merchantId: string;
  planName: string;
  status: string;
  billingCycle: string;
  remainingDays: number;
  renewalDate: string;
  showRenewalWarningBanner: boolean;
  renewalWarningMessage?: string;
  quotas: SubscriptionQuotaStatus;
}

/**
 * Enterprise Service for Monitoring Active Merchant Subscription Status, Resource Quotas, and Expiration Banners.
 */
export class SubscriptionBannerService {
  private static instance: SubscriptionBannerService | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionBannerService {
    if (!SubscriptionBannerService.instance) {
      SubscriptionBannerService.instance = new SubscriptionBannerService();
    }
    return SubscriptionBannerService.instance;
  }

  /**
   * Evaluates merchant subscription expiration date and calculates remaining days and resource usage caps.
   */
  public async getSubscriptionStatusOverview(merchantId: string): Promise<SubscriptionBannerOverview> {
    const subscription = await onboardingService.getSubscriptionByMerchantId(merchantId);
    const plan = subscription ? await planService.getPlanById(subscription.planId) : null;

    const planName = plan ? plan.name : 'Professional Plan';
    const status = subscription ? subscription.status : 'ACTIVE';
    const billingCycle = subscription ? subscription.billingCycle : 'YEARLY';
    const periodEnd = subscription ? new Date(subscription.currentPeriodEnd) : new Date(Date.now() + 240 * 86400000);

    const now = new Date();
    const remainingTimeMs = Math.max(0, periodEnd.getTime() - now.getTime());
    const remainingDays = Math.ceil(remainingTimeMs / 86400000);

    // Show warning banner if 7 or fewer days remaining
    const showRenewalWarningBanner = remainingDays <= 7 && status === 'ACTIVE';
    const renewalWarningMessage = showRenewalWarningBanner
      ? `⚠️ Your ${planName} subscription will expire in ${remainingDays} days. Please renew to prevent service interruption.`
      : undefined;

    // Simulated usage vs quotas
    const maxProducts = (plan?.limits as any)?.maxProducts || 1000;
    const maxOrders = (plan?.limits as any)?.maxOrders || 5000;
    const maxUsers = (plan?.limits as any)?.maxUsers || 5;

    const productsUsed = 420;
    const ordersUsed = 1240;
    const usersUsed = 3;

    return {
      merchantId,
      planName,
      status,
      billingCycle,
      remainingDays,
      renewalDate: periodEnd.toISOString(),
      showRenewalWarningBanner,
      renewalWarningMessage,
      quotas: {
        productsUsed,
        maxProducts,
        productsPercentage: Math.round((productsUsed / maxProducts) * 100),
        ordersUsed,
        maxOrders,
        ordersPercentage: Math.round((ordersUsed / maxOrders) * 100),
        usersUsed,
        maxUsers,
        usersPercentage: Math.round((usersUsed / maxUsers) * 100),
      },
    };
  }
}

export const subscriptionBannerService = SubscriptionBannerService.getInstance();
