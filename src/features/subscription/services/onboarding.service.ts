import { BillingCycle, Subscription, SubscriptionInvoice } from '../../../types/subscription.types';
import { merchantService } from '../../platform-admin/services/merchant.service';
import { planService } from '../../platform-admin/services/plan.service';
import { couponService } from './coupon.service';
import { provisioningService, ProvisioningResult } from './provisioning.service';

export interface MerchantRegistrationDTO {
  ownerName: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  businessName: string;
  subdomain: string;
  planId: string;
  billingCycle?: BillingCycle;
  couponCode?: string;
}

export interface OnboardingRegistrationResult {
  merchantId: string;
  tenantSlug: string;
  subscription: Subscription;
  invoice: SubscriptionInvoice;
  provisioning: ProvisioningResult;
}

const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'app',
  'login',
  'register',
  'static',
  '_next',
  'terms',
  'privacy',
  'support',
  'mail',
  'dashboard',
];

/**
 * Enterprise Service for Merchant Registration, Trial Allocation, and Automated Provisioning Pipeline.
 */
export class OnboardingService {
  private static instance: OnboardingService | null = null;
  private subscriptionsStore: Map<string, Subscription> = new Map();
  private invoicesStore: Map<string, SubscriptionInvoice> = new Map();

  private constructor() {}

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Checks whether a subdomain slug is valid and available for registration.
   */
  public async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain.toLowerCase())) {
      return false;
    }

    const cleanSlug = subdomain.toLowerCase().trim();
    if (RESERVED_SUBDOMAINS.includes(cleanSlug)) {
      return false;
    }

    const existingMerchant = await merchantService.getMerchantBySlug(cleanSlug);
    return existingMerchant === null;
  }

  /**
   * Registers a new merchant with a selected plan, allocates trial days, creates initial invoice, and provisions store.
   */
  public async registerMerchantWithPlan(dto: MerchantRegistrationDTO): Promise<OnboardingRegistrationResult> {
    const cleanSubdomain = dto.subdomain.toLowerCase().trim();
    const available = await this.isSubdomainAvailable(cleanSubdomain);
    if (!available) {
      throw new Error(`Subdomain "${cleanSubdomain}" is unavailable or reserved.`);
    }

    const plan = await planService.getPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new Error(`Plan with ID "${dto.planId}" is invalid or inactive.`);
    }

    const billingCycle: BillingCycle = dto.billingCycle || 'MONTHLY';
    const basePrice = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

    // Calculate billing with potential coupon
    const billing = await couponService.calculateBilling(basePrice, dto.couponCode, 0);

    if (dto.couponCode && billing.appliedCouponCode) {
      await couponService.redeemCoupon(billing.appliedCouponCode);
    }

    // 1. Create Merchant via MerchantService
    const merchant = await merchantService.createMerchant({
      name: dto.businessName,
      slug: cleanSubdomain,
      ownerName: dto.ownerName,
      email: dto.email,
      phone: dto.phone,
      planId: plan.id,
      trialDays: plan.trialDays,
    });

    const now = new Date();
    const trialDays = plan.trialDays || 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 86400000).toISOString();
    const periodEnd = new Date(now.getTime() + (billingCycle === 'YEARLY' ? 365 : 30) * 86400000).toISOString();

    // 2. Create Subscription Lifecycle Record
    const subscription: Subscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      merchantId: merchant.id,
      planId: plan.id,
      status: 'TRIALING',
      billingCycle,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      cancelledAt: null,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.subscriptionsStore.set(subscription.id, subscription);

    // 3. Create Initial Subscription Invoice
    const invoice: SubscriptionInvoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      merchantId: merchant.id,
      subscriptionId: subscription.id,
      amount: billing.basePrice,
      discountAmount: billing.discountAmount,
      taxAmount: billing.taxAmount,
      totalAmount: billing.totalAmount,
      paymentStatus: 'PAID', // Initial trial period marked as paid
      paymentMethod: 'TRIAL_ALLOCATION',
      transactionId: `TXN-TRIAL-${merchant.id.slice(-6)}`,
      pdfUrl: `/api/invoices/download/INV-${Date.now().toString().slice(-6)}`,
      createdAt: now.toISOString(),
    };
    this.invoicesStore.set(invoice.id, invoice);

    // 4. Trigger Automated Store Provisioning
    const provisioning = await provisioningService.provisionMerchantStore(merchant.id);

    return {
      merchantId: merchant.id,
      tenantSlug: merchant.slug,
      subscription,
      invoice,
      provisioning,
    };
  }

  public async getSubscriptionByMerchantId(merchantId: string): Promise<Subscription | null> {
    for (const sub of this.subscriptionsStore.values()) {
      if (sub.merchantId === merchantId) return sub;
    }
    return null;
  }
}

export const onboardingService = OnboardingService.getInstance();
