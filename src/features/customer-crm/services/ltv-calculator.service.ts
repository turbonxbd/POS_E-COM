import {
  CRMCustomerProfileDTO,
  DEFAULT_LOYALTY_CONFIG,
  MembershipTierType,
} from '../../../types/customer-crm.types';
import { segmentationService } from './segmentation.service';

/**
 * Enterprise Service for Customer LTV (Lifetime Value), AOV, Membership Tier Upgrades, and Metrics Aggregation.
 */
export class LTVCalculatorService {
  private static instance: LTVCalculatorService | null = null;
  // In-memory CRM Store: Map<merchantId, Map<customerId, CRMCustomerProfileDTO>>
  private profilesStore: Map<string, Map<string, CRMCustomerProfileDTO>> = new Map();

  private constructor() {
    this.seedDemoCRMProfiles();
  }

  public static getInstance(): LTVCalculatorService {
    if (!LTVCalculatorService.instance) {
      LTVCalculatorService.instance = new LTVCalculatorService();
    }
    return LTVCalculatorService.instance;
  }

  /**
   * Recalculates customer LTV, AOV, order count, and membership tier upon order completion or refund.
   */
  public async recalculateCustomerLTV(
    merchantId: string,
    customerId: string,
    additionalSpendBDT: number = 0,
    incrementOrderCount: boolean = true
  ): Promise<CRMCustomerProfileDTO> {
    const merchantProfiles = this.profilesStore.get(merchantId) || new Map();
    let profile = merchantProfiles.get(customerId);

    if (!profile) {
      profile = {
        id: `crm-${Date.now()}`,
        merchantId,
        customerId,
        totalOrdersCount: 0,
        lifetimeValue: 0,
        averageOrderValue: 0,
        rewardPoints: 0,
        membershipTier: 'BRONZE',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 1. Recalculate Metrics
    const newTotalOrders = incrementOrderCount
      ? profile.totalOrdersCount + 1
      : Math.max(0, profile.totalOrdersCount);
    const newLTV = Math.max(0, Math.round((profile.lifetimeValue + additionalSpendBDT) * 100) / 100);
    const newAOV = newTotalOrders > 0 ? Math.round((newLTV / newTotalOrders) * 100) / 100 : 0;

    // 2. Award Reward Points (100 BDT spent = 1 Point)
    const pointsEarned = Math.floor(additionalSpendBDT / DEFAULT_LOYALTY_CONFIG.spendPointsRatio);
    const newPoints = Math.max(0, profile.rewardPoints + pointsEarned);

    // 3. Determine Membership Tier
    let newTier: MembershipTierType = 'BRONZE';
    const thresholds = DEFAULT_LOYALTY_CONFIG.tierThresholds;

    if (newLTV >= thresholds.PLATINUM) {
      newTier = 'PLATINUM';
    } else if (newLTV >= thresholds.GOLD) {
      newTier = 'GOLD';
    } else if (newLTV >= thresholds.SILVER) {
      newTier = 'SILVER';
    }

    const updatedProfile: CRMCustomerProfileDTO = {
      ...profile,
      totalOrdersCount: newTotalOrders,
      lifetimeValue: newLTV,
      averageOrderValue: newAOV,
      rewardPoints: newPoints,
      membershipTier: newTier,
      lastOrderAt: incrementOrderCount ? new Date().toISOString() : profile.lastOrderAt,
      updatedAt: new Date().toISOString(),
    };

    // 4. Trigger Auto-Segmentation Evaluation
    const segRes = segmentationService.evaluateCustomerSegments(merchantId, updatedProfile);
    updatedProfile.tags = segRes.tags;

    merchantProfiles.set(customerId, updatedProfile);
    this.profilesStore.set(merchantId, merchantProfiles);

    return updatedProfile;
  }

  /**
   * Fetches customer CRM profile.
   */
  public async getCustomerProfile(
    merchantId: string,
    customerId: string
  ): Promise<CRMCustomerProfileDTO | null> {
    const merchantProfiles = this.profilesStore.get(merchantId);
    return merchantProfiles?.get(customerId) || null;
  }

  /**
   * Fetches all customer CRM profiles for a merchant.
   */
  public async getAllMerchantProfiles(merchantId: string): Promise<CRMCustomerProfileDTO[]> {
    const merchantProfiles = this.profilesStore.get(merchantId);
    if (!merchantProfiles) return [];
    return Array.from(merchantProfiles.values());
  }

  private seedDemoCRMProfiles(): void {
    const demoMerchantId = 'merch-techstore';
    const demoProfiles = new Map<string, CRMCustomerProfileDTO>();

    const karimProfile: CRMCustomerProfileDTO = {
      id: 'crm-101',
      merchantId: demoMerchantId,
      customerId: 'cust-101',
      totalOrdersCount: 6,
      lifetimeValue: 24500,
      averageOrderValue: 4083.33,
      rewardPoints: 245,
      membershipTier: 'GOLD',
      dateOfBirth: '1995-08-15T00:00:00.000Z',
      gender: 'MALE',
      tags: ['VIP', 'High-Spender'],
      lastOrderAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nusratProfile: CRMCustomerProfileDTO = {
      id: 'crm-102',
      merchantId: demoMerchantId,
      customerId: 'cust-102',
      totalOrdersCount: 1,
      lifetimeValue: 1800,
      averageOrderValue: 1800,
      rewardPoints: 18,
      membershipTier: 'BRONZE',
      dateOfBirth: '1998-08-20T00:00:00.000Z',
      gender: 'FEMALE',
      tags: ['New-Buyer'],
      lastOrderAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoProfiles.set('cust-101', karimProfile);
    demoProfiles.set('cust-102', nusratProfile);

    this.profilesStore.set(demoMerchantId, demoProfiles);
  }
}

export const ltvCalculatorService = LTVCalculatorService.getInstance();
