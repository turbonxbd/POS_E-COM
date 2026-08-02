import { Subscription, SubscriptionHistory, SubscriptionInvoice } from '../../../types/subscription.types';
import { onboardingService } from './onboarding.service';
import { planService } from '../../platform-admin/services/plan.service';
import { merchantService } from '../../platform-admin/services/merchant.service';
import { auditService } from '../../platform-admin/services/audit.service';

export interface ProratedUpgradeResult {
  merchantId: string;
  oldPlanId: string;
  newPlanId: string;
  remainingDays: number;
  proratedAmount: number;
  invoice: SubscriptionInvoice;
  subscription: Subscription;
}

/**
 * Enterprise Service for Managing Subscription Upgrades, Prorated Charges, Downgrades, and Cancellations.
 */
export class SubscriptionLifecycleService {
  private static instance: SubscriptionLifecycleService | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionLifecycleService {
    if (!SubscriptionLifecycleService.instance) {
      SubscriptionLifecycleService.instance = new SubscriptionLifecycleService();
    }
    return SubscriptionLifecycleService.instance;
  }

  /**
   * Upgrades a merchant subscription to a higher tier plan with prorated charge calculation.
   */
  public async upgradePlan(
    merchantId: string,
    newPlanId: string,
    paymentMethod = 'CREDIT_CARD'
  ): Promise<ProratedUpgradeResult> {
    const subscription = await onboardingService.getSubscriptionByMerchantId(merchantId);
    if (!subscription) {
      throw new Error(`Active subscription not found for merchant "${merchantId}".`);
    }

    if (subscription.planId === newPlanId) {
      throw new Error('Merchant is already subscribed to this plan.');
    }

    const oldPlan = await planService.getPlanById(subscription.planId);
    const newPlan = await planService.getPlanById(newPlanId);

    if (!oldPlan || !newPlan || !newPlan.isActive) {
      throw new Error('Invalid target upgrade plan selected.');
    }

    // Calculate prorated price difference
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const remainingTimeMs = Math.max(0, periodEnd.getTime() - now.getTime());
    const remainingDays = Math.ceil(remainingTimeMs / 86400000);

    const isYearly = subscription.billingCycle === 'YEARLY';
    const oldDailyRate = (isYearly ? oldPlan.yearlyPrice : oldPlan.monthlyPrice) / (isYearly ? 365 : 30);
    const newDailyRate = (isYearly ? newPlan.yearlyPrice : newPlan.monthlyPrice) / (isYearly ? 365 : 30);

    const dailyDifference = Math.max(0, newDailyRate - oldDailyRate);
    const proratedAmount = Number((dailyDifference * remainingDays).toFixed(2));

    // Update Subscription Record
    const oldPlanId = subscription.planId;
    subscription.planId = newPlan.id;
    subscription.status = 'ACTIVE';
    subscription.updatedAt = now.toISOString();

    // Update Merchant Record Plan Reference
    await merchantService.updateMerchant(merchantId, { planId: newPlan.id });

    // Generate Upgrade Invoice
    const invoice: SubscriptionInvoice = {
      id: `inv-upg-${Date.now()}`,
      invoiceNumber: `INV-UPG-${Date.now().toString().slice(-6)}`,
      merchantId,
      subscriptionId: subscription.id,
      amount: proratedAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: proratedAmount,
      paymentStatus: 'PAID',
      paymentMethod,
      transactionId: `TXN-UPGRADE-${Date.now()}`,
      pdfUrl: `/api/invoices/download/INV-UPG-${Date.now().toString().slice(-6)}`,
      createdAt: now.toISOString(),
    };

    // Log Audit Action
    await auditService.logAdminAction({
      adminId: 'system-lifecycle-engine',
      action: 'UPGRADE_SUBSCRIPTION',
      targetResource: `Merchant:${merchantId}`,
      details: { oldPlanId, newPlanId: newPlan.id, proratedAmount, remainingDays },
    });

    return {
      merchantId,
      oldPlanId,
      newPlanId: newPlan.id,
      remainingDays,
      proratedAmount,
      invoice,
      subscription,
    };
  }

  /**
   * Downgrades a merchant subscription to a lower tier plan.
   */
  public async downgradePlan(merchantId: string, newPlanId: string): Promise<Subscription> {
    const subscription = await onboardingService.getSubscriptionByMerchantId(merchantId);
    if (!subscription) {
      throw new Error(`Subscription not found for merchant "${merchantId}".`);
    }

    const newPlan = await planService.getPlanById(newPlanId);
    if (!newPlan || !newPlan.isActive) {
      throw new Error('Invalid target downgrade plan selected.');
    }

    const oldPlanId = subscription.planId;
    subscription.planId = newPlan.id;
    subscription.updatedAt = new Date().toISOString();

    await merchantService.updateMerchant(merchantId, { planId: newPlan.id });

    await auditService.logAdminAction({
      adminId: 'system-lifecycle-engine',
      action: 'DOWNGRADE_SUBSCRIPTION',
      targetResource: `Merchant:${merchantId}`,
      details: { oldPlanId, newPlanId: newPlan.id },
    });

    return subscription;
  }

  /**
   * Extends subscription period for another billing cycle.
   */
  public async renewSubscription(merchantId: string): Promise<Subscription> {
    const subscription = await onboardingService.getSubscriptionByMerchantId(merchantId);
    if (!subscription) {
      throw new Error(`Subscription not found for merchant "${merchantId}".`);
    }

    const currentEnd = new Date(subscription.currentPeriodEnd).getTime();
    const daysToAdd = subscription.billingCycle === 'YEARLY' ? 365 : 30;
    subscription.currentPeriodEnd = new Date(currentEnd + daysToAdd * 86400000).toISOString();
    subscription.status = 'ACTIVE';
    subscription.updatedAt = new Date().toISOString();

    await auditService.logAdminAction({
      adminId: 'system-lifecycle-engine',
      action: 'RENEW_SUBSCRIPTION',
      targetResource: `Merchant:${merchantId}`,
      details: { newPeriodEnd: subscription.currentPeriodEnd },
    });

    return subscription;
  }

  /**
   * Cancels a merchant subscription at period end or immediately.
   */
  public async cancelSubscription(merchantId: string): Promise<Subscription> {
    const subscription = await onboardingService.getSubscriptionByMerchantId(merchantId);
    if (!subscription) {
      throw new Error(`Subscription not found for merchant "${merchantId}".`);
    }

    const now = new Date().toISOString();
    subscription.autoRenew = false;
    subscription.cancelledAt = now;
    subscription.status = 'CANCELLED';
    subscription.updatedAt = now;

    await auditService.logAdminAction({
      adminId: 'system-lifecycle-engine',
      action: 'CANCEL_SUBSCRIPTION',
      targetResource: `Merchant:${merchantId}`,
      details: { cancelledAt: now },
    });

    return subscription;
  }
}

export const subscriptionLifecycleService = SubscriptionLifecycleService.getInstance();
