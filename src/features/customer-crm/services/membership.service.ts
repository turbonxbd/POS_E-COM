import {
  DEFAULT_LOYALTY_CONFIG,
  MembershipTierType,
} from '../../../types/customer-crm.types';
import { ltvCalculatorService } from './ltv-calculator.service';

export interface TierEvaluationResult {
  tierChanged: boolean;
  previousTier?: MembershipTierType;
  newTier: MembershipTierType;
  lifetimeValue: number;
  message: string;
}

/**
 * Enterprise Service for Automated Membership Tier Upgrades and Badge Tier Evaluations.
 */
export class MembershipService {
  private static instance: MembershipService | null = null;

  private constructor() {}

  public static getInstance(): MembershipService {
    if (!MembershipService.instance) {
      MembershipService.instance = new MembershipService();
    }
    return MembershipService.instance;
  }

  /**
   * Evaluates customer lifetime spent against tier thresholds and updates membership tier.
   */
  public async evaluateAndUpgradeTier(
    merchantId: string,
    customerId: string
  ): Promise<TierEvaluationResult> {
    const profile = await ltvCalculatorService.getCustomerProfile(merchantId, customerId);

    if (!profile) {
      throw new Error(`Customer CRM profile "${customerId}" not found.`);
    }

    const ltv = profile.lifetimeValue;
    const thresholds = DEFAULT_LOYALTY_CONFIG.tierThresholds;
    const previousTier = profile.membershipTier;

    let targetTier: MembershipTierType = 'BRONZE';
    if (ltv >= thresholds.PLATINUM) {
      targetTier = 'PLATINUM';
    } else if (ltv >= thresholds.GOLD) {
      targetTier = 'GOLD';
    } else if (ltv >= thresholds.SILVER) {
      targetTier = 'SILVER';
    }

    const tierChanged = previousTier !== targetTier;
    if (tierChanged) {
      profile.membershipTier = targetTier;
      profile.updatedAt = new Date().toISOString();

      console.log(
        `[MembershipService] Customer ${customerId} membership tier changed from ${previousTier} to ${targetTier}!`
      );
    }

    return {
      tierChanged,
      previousTier,
      newTier: targetTier,
      lifetimeValue: ltv,
      message: tierChanged
        ? `Membership tier upgraded to ${targetTier}! (LTV: ৳${ltv.toLocaleString()})`
        : `Membership tier remains ${targetTier}. (LTV: ৳${ltv.toLocaleString()})`,
    };
  }
}

export const membershipService = MembershipService.getInstance();
