import { merchantService } from '../../platform-admin/services/merchant.service';
import { auditService } from '../../platform-admin/services/audit.service';
import { Subscription } from '../../../types/subscription.types';

export interface ExpirationCronSummary {
  processedCount: number;
  reminderSentCount: number;
  gracePeriodCount: number;
  expiredCount: number;
  readOnlyLockedCount: number;
  executedAt: string;
}

/**
 * Enterprise Background Cron Handler for Subscription Expiration Tracking, Grace Periods, and Access Lock Enforcement.
 */
export class SubscriptionExpirationCron {
  private static instance: SubscriptionExpirationCron | null = null;
  private lockedMerchantIds: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): SubscriptionExpirationCron {
    if (!SubscriptionExpirationCron.instance) {
      SubscriptionExpirationCron.instance = new SubscriptionExpirationCron();
    }
    return SubscriptionExpirationCron.instance;
  }

  /**
   * Scans all merchant subscriptions and enforces expiration states, notifications, and access locks.
   */
  public async runExpirationCheck(activeSubscriptions: Subscription[]): Promise<ExpirationCronSummary> {
    const now = Date.now();
    let reminderSentCount = 0;
    let gracePeriodCount = 0;
    let expiredCount = 0;
    let readOnlyLockedCount = 0;

    for (const sub of activeSubscriptions) {
      const periodEnd = new Date(sub.currentPeriodEnd).getTime();
      const diffMs = periodEnd - now;
      const diffDays = Math.ceil(diffMs / 86400000);

      // 1. Identify subscriptions ending within 3 days -> Send Renewal Reminder
      if (diffDays > 0 && diffDays <= 3 && sub.status === 'ACTIVE') {
        this.sendRenewalReminder(sub.merchantId, diffDays);
        reminderSentCount++;
      }

      // 2. Identify expired subscriptions -> Change to PAST_DUE (7-day Grace Period)
      else if (diffDays <= 0 && diffDays >= -7 && sub.status !== 'PAST_DUE') {
        sub.status = 'PAST_DUE';
        sub.updatedAt = new Date().toISOString();
        gracePeriodCount++;

        await auditService.logAdminAction({
          adminId: 'system-cron-job',
          action: 'ENTER_SUBSCRIPTION_GRACE_PERIOD',
          targetResource: `Merchant:${sub.merchantId}`,
          details: { daysPastDue: Math.abs(diffDays) },
        });
      }

      // 3. Unpaid past grace period (>7 days overdue) -> Change to EXPIRED & Lock Read-Only Mode
      else if (diffDays < -7 && sub.status !== 'EXPIRED') {
        sub.status = 'EXPIRED';
        sub.updatedAt = new Date().toISOString();
        expiredCount++;

        // Enforce Merchant Portal Read-Only Access Lock
        this.lockedMerchantIds.add(sub.merchantId);
        readOnlyLockedCount++;

        await merchantService.updateMerchant(sub.merchantId, { status: 'SUSPENDED' });

        await auditService.logAdminAction({
          adminId: 'system-cron-job',
          action: 'LOCK_MERCHANT_READ_ONLY_ACCESS',
          targetResource: `Merchant:${sub.merchantId}`,
          details: { reason: 'Subscription expired past 7-day grace period' },
        });
      }
    }

    return {
      processedCount: activeSubscriptions.length,
      reminderSentCount,
      gracePeriodCount,
      expiredCount,
      readOnlyLockedCount,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Checks if a merchant is locked in Read-Only Mode due to subscription expiration.
   */
  public isMerchantLockedReadOnly(merchantId: string): boolean {
    return this.lockedMerchantIds.has(merchantId);
  }

  /**
   * Unlocks Read-Only Mode upon successful subscription renewal.
   */
  public unlockMerchantAccess(merchantId: string): boolean {
    return this.lockedMerchantIds.delete(merchantId);
  }

  private sendRenewalReminder(merchantId: string, daysRemaining: number): void {
    console.log(`[ExpirationCronNotifier] Reminder sent to Merchant ${merchantId}: Subscription expires in ${daysRemaining} days.`);
  }
}

export const subscriptionExpirationCron = SubscriptionExpirationCron.getInstance();
