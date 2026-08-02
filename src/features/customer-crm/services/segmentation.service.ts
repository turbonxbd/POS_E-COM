import { CRMCustomerProfileDTO } from '../../../types/customer-crm.types';

export interface CustomerSegmentSummary {
  segmentId: string;
  segmentName: string;
  memberCount: number;
  description: string;
}

/**
 * Enterprise Service for Dynamic Customer Auto-Segmentation (RFM - Recency, Frequency, Monetary).
 */
export class SegmentationService {
  private static instance: SegmentationService | null = null;

  private constructor() {}

  public static getInstance(): SegmentationService {
    if (!SegmentationService.instance) {
      SegmentationService.instance = new SegmentationService();
    }
    return SegmentationService.instance;
  }

  /**
   * Evaluates customer profile metrics and updates automated behavioral segment tags.
   */
  public evaluateCustomerSegments(
    merchantId: string,
    profile: CRMCustomerProfileDTO
  ): { tags: string[]; assignedSegments: string[] } {
    const updatedTags = new Set<string>(profile.tags || []);
    const assignedSegments: string[] = [];

    const now = new Date().getTime();
    const lastOrderTime = profile.lastOrderAt ? new Date(profile.lastOrderAt).getTime() : now;
    const daysSinceLastOrder = Math.floor((now - lastOrderTime) / (1000 * 60 * 60 * 24));

    // 1. VIP / High-Spender Rule (LTV >= 20,000 & Orders >= 5)
    if (profile.lifetimeValue >= 20000 && profile.totalOrdersCount >= 5) {
      updatedTags.add('VIP');
      updatedTags.add('High-Spender');
      assignedSegments.push('VIP Customers');
    }

    // 2. At-Risk / Inactive Rule (LTV >= 5,000 & No orders in last 60 days)
    if (profile.lifetimeValue >= 5000 && daysSinceLastOrder >= 60) {
      updatedTags.add('At-Risk');
      updatedTags.add('Inactive');
      assignedSegments.push('At-Risk / Inactive Customers');
    } else {
      updatedTags.delete('At-Risk');
      updatedTags.delete('Inactive');
    }

    // 3. New Buyer Rule (Exactly 1 completed order)
    if (profile.totalOrdersCount === 1) {
      updatedTags.add('New-Buyer');
      assignedSegments.push('New Buyers');
    } else {
      updatedTags.delete('New-Buyer');
    }

    // 4. Bargain Hunter / Rewards Redeemer Rule
    if (profile.rewardPoints >= 100) {
      updatedTags.add('Bargain-Hunter');
      assignedSegments.push('Bargain Hunters');
    }

    return {
      tags: Array.from(updatedTags),
      assignedSegments,
    };
  }

  /**
   * Generates segment metrics breakdown for merchant CRM dashboard view.
   */
  public getSegmentBreakdown(profiles: CRMCustomerProfileDTO[]): CustomerSegmentSummary[] {
    let vipCount = 0;
    let atRiskCount = 0;
    let newBuyerCount = 0;
    let bargainHunterCount = 0;

    for (const p of profiles) {
      if (p.tags.includes('VIP')) vipCount++;
      if (p.tags.includes('At-Risk')) atRiskCount++;
      if (p.tags.includes('New-Buyer')) newBuyerCount++;
      if (p.tags.includes('Bargain-Hunter')) bargainHunterCount++;
    }

    return [
      {
        segmentId: 'seg-vip',
        segmentName: 'VIP Customers',
        memberCount: vipCount,
        description: 'High lifetime value (LTV >= ৳20,000) and 5+ completed orders.',
      },
      {
        segmentId: 'seg-at-risk',
        segmentName: 'At-Risk / Inactive',
        memberCount: atRiskCount,
        description: 'High past spenders with no purchases in the last 60 days.',
      },
      {
        segmentId: 'seg-new-buyers',
        segmentName: 'New Buyers',
        memberCount: newBuyerCount,
        description: 'First-time purchasers with exactly 1 order.',
      },
      {
        segmentId: 'seg-bargain-hunters',
        segmentName: 'Bargain Hunters',
        memberCount: bargainHunterCount,
        description: 'Customers with active reward points or frequent coupon usage.',
      },
    ];
  }
}

export const segmentationService = SegmentationService.getInstance();
