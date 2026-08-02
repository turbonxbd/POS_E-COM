export type MembershipTierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type RewardActionType =
  | 'EARNED_PURCHASE'
  | 'REDEEMED_ORDER'
  | 'BONUS_BIRTHDAY'
  | 'MANUAL_ADJUSTMENT';

export interface CRMCustomerProfileDTO {
  id: string;
  merchantId: string;
  customerId: string;
  totalOrdersCount: number;
  lifetimeValue: number; // LTV BDT
  averageOrderValue: number; // AOV BDT
  rewardPoints: number;
  membershipTier: MembershipTierType;
  dateOfBirth?: string | null;
  gender?: string | null;
  tags: string[];
  lastOrderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomerSummary {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  email?: string | null;
  profile: CRMCustomerProfileDTO;
  notesCount: number;
  addressSummary?: string | null;
}

export interface RewardTransactionDTO {
  id: string;
  merchantId: string;
  customerId: string;
  pointsChanged: number;
  actionType: RewardActionType;
  referenceOrderId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface CustomerNoteDTO {
  id: string;
  merchantId: string;
  customerId: string;
  createdBy: string;
  noteText: string;
  isImportant: boolean;
  createdAt: string;
}

export interface CustomerSegmentCriteria {
  minLTV?: number;
  maxLTV?: number;
  minOrders?: number;
  maxOrders?: number;
  minAOV?: number;
  inactiveDays?: number;
  membershipTier?: MembershipTierType;
  hasTags?: string[];
}

export interface CRMSegmentRuleDTO {
  id: string;
  merchantId: string;
  segmentName: string;
  criteria: CustomerSegmentCriteria;
  autoAssign: boolean;
  memberCount?: number;
  createdAt: string;
}

export interface LoyaltyConfig {
  spendPointsRatio: number; // e.g. 100 BDT spent = 1 Point
  pointValueBDT: number; // e.g. 1 Point = 1 BDT discount
  tierThresholds: Record<MembershipTierType, number>;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  spendPointsRatio: 100, // 100 BDT = 1 Point
  pointValueBDT: 1, // 1 Point = 1 BDT
  tierThresholds: {
    BRONZE: 0,
    SILVER: 5000,
    GOLD: 20000,
    PLATINUM: 50000,
  },
};

export const CRM_DEFAULT_TAGS: string[] = [
  'VIP',
  'High-Spender',
  'Frequent-Returner',
  'New-Buyer',
  'Inactive',
  'Wholesale-Buyer',
];
