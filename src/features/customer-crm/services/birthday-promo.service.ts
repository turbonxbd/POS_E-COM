import { RewardTransactionDTO } from '../../../types/customer-crm.types';
import { ltvCalculatorService } from './ltv-calculator.service';

export interface BirthdayBonusResult {
  success: boolean;
  customerId: string;
  pointsAwarded: number;
  promoCode: string;
  message: string;
}

/**
 * Enterprise Service for Customer Birthday Alerts, Automated Bonus Points, and Promo Coupon Generation.
 */
export class BirthdayPromoService {
  private static instance: BirthdayPromoService | null = null;
  // In-memory store: Map<customerId, RewardTransactionDTO[]>
  private rewardLogsStore: Map<string, RewardTransactionDTO[]> = new Map();

  private constructor() {}

  public static getInstance(): BirthdayPromoService {
    if (!BirthdayPromoService.instance) {
      BirthdayPromoService.instance = new BirthdayPromoService();
    }
    return BirthdayPromoService.instance;
  }

  /**
   * Identifies customers with birthdays occurring in the upcoming N days.
   */
  public async getUpcomingBirthdays(
    merchantId: string,
    daysAhead: number = 30
  ): Promise<{ customerId: string; dateOfBirth: string; daysRemaining: number }[]> {
    const profiles = await ltvCalculatorService.getAllMerchantProfiles(merchantId);
    const results: { customerId: string; dateOfBirth: string; daysRemaining: number }[] = [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    for (const p of profiles) {
      if (!p.dateOfBirth) continue;
      const dob = new Date(p.dateOfBirth);
      const dobMonth = dob.getMonth();
      const dobDay = dob.getDate();

      // Check if birthday falls in current month or next month
      if (dobMonth === currentMonth || dobMonth === (currentMonth + 1) % 12) {
        const daysRemaining = Math.max(0, dobDay - currentDay);
        if (daysRemaining <= daysAhead) {
          results.push({
            customerId: p.customerId,
            dateOfBirth: p.dateOfBirth,
            daysRemaining,
          });
        }
      }
    }

    return results;
  }

  /**
   * Awards birthday bonus reward points and generates a unique birthday discount promo code.
   */
  public async processBirthdayBonus(
    merchantId: string,
    customerId: string,
    bonusPoints: number = 100
  ): Promise<BirthdayBonusResult> {
    const profile = await ltvCalculatorService.getCustomerProfile(merchantId, customerId);

    if (!profile) {
      throw new Error(`Customer CRM profile "${customerId}" not found.`);
    }

    // Award bonus points via LTV calculator
    profile.rewardPoints += bonusPoints;

    const promoCode = `BDAY-${new Date().getFullYear()}-${customerId.slice(-4).toUpperCase()}`;

    const rewardLog: RewardTransactionDTO = {
      id: `rw-bday-${Date.now()}`,
      merchantId,
      customerId,
      pointsChanged: bonusPoints,
      actionType: 'BONUS_BIRTHDAY',
      note: `Happy Birthday! Granted ${bonusPoints} bonus reward points & promo code ${promoCode}`,
      createdAt: new Date().toISOString(),
    };

    const logs = this.rewardLogsStore.get(customerId) || [];
    logs.unshift(rewardLog);
    this.rewardLogsStore.set(customerId, logs);

    return {
      success: true,
      customerId,
      pointsAwarded: bonusPoints,
      promoCode,
      message: `Happy Birthday bonus awarded! ${bonusPoints} reward points & code "${promoCode}" generated.`,
    };
  }

  /**
   * Fetches customer reward transaction history.
   */
  public async getCustomerRewardLogs(customerId: string): Promise<RewardTransactionDTO[]> {
    return this.rewardLogsStore.get(customerId) || [];
  }
}

export const birthdayPromoService = BirthdayPromoService.getInstance();
