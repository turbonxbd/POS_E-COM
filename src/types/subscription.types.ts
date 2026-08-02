/**
 * Operational Status of a Merchant Subscription.
 */
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

/**
 * Subscription Billing Cycle.
 */
export type BillingCycle = 'MONTHLY' | 'YEARLY';

/**
 * Subscription Invoice Payment Status.
 */
export type InvoicePaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

/**
 * Coupon Discount Type.
 */
export type DiscountType = 'PERCENTAGE' | 'FIXED';

/**
 * Subscription Audit Action.
 */
export type SubscriptionAction = 'REGISTER' | 'RENEW' | 'UPGRADE' | 'DOWNGRADE' | 'EXPIRE' | 'CANCEL';

/**
 * Merchant Subscription Entity.
 */
export interface Subscription {
  id: string;
  merchantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription Invoice Billing Record Entity.
 */
export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  subscriptionId: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: InvoicePaymentStatus;
  paymentMethod?: string | null;
  transactionId?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
}

/**
 * Promotional Coupon Entity.
 */
export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: Boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription Audit & Change History Entity.
 */
export interface SubscriptionHistory {
  id: string;
  merchantId: string;
  action: SubscriptionAction;
  oldPlanId?: string | null;
  newPlanId?: string | null;
  amountPaid: number;
  createdAt: string;
}

// --- DTOs & Calculation Results ---

export interface CreateCouponDTO {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  error?: string;
}

export interface BillingCalculationResult {
  basePrice: number;
  discountAmount: number;
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  appliedCouponCode?: string;
}

export interface PlanUpgradeDTO {
  merchantId: string;
  newPlanId: string;
  billingCycle: BillingCycle;
  couponCode?: string;
  paymentMethod: string;
}
