import {
  Coupon,
  CreateCouponDTO,
  CouponValidationResult,
  BillingCalculationResult,
} from '../../../types/subscription.types';
import { auditService } from '../../platform-admin/services/audit.service';

/**
 * Enterprise Service for Promotional Coupon Code Validation, Discount Calculation, and Usage Tracking.
 */
export class CouponService {
  private static instance: CouponService | null = null;
  private couponsStore: Map<string, Coupon> = new Map();

  private constructor() {
    this.seedInitialCoupons();
  }

  public static getInstance(): CouponService {
    if (!CouponService.instance) {
      CouponService.instance = new CouponService();
    }
    return CouponService.instance;
  }

  /**
   * Validates coupon code and calculates discount amount and final price.
   */
  public async validateAndCalculateDiscount(
    couponCode: string,
    planPrice: number
  ): Promise<CouponValidationResult> {
    if (!couponCode || couponCode.trim().length === 0) {
      return {
        valid: false,
        code: '',
        discountAmount: 0,
        finalPrice: planPrice,
        error: 'Coupon code cannot be empty.',
      };
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = this.couponsStore.get(cleanCode);

    if (!coupon) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalPrice: planPrice,
        error: `Invalid promo code "${cleanCode}".`,
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalPrice: planPrice,
        error: `Promo code "${cleanCode}" is no longer active.`,
      };
    }

    const now = Date.now();
    const validFromTime = new Date(coupon.validFrom).getTime();
    if (now < validFromTime) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalPrice: planPrice,
        error: `Promo code "${cleanCode}" is not valid yet.`,
      };
    }

    if (coupon.validUntil) {
      const validUntilTime = new Date(coupon.validUntil).getTime();
      if (now > validUntilTime) {
        return {
          valid: false,
          code: cleanCode,
          discountAmount: 0,
          finalPrice: planPrice,
          error: `Promo code "${cleanCode}" has expired.`,
        };
      }
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        finalPrice: planPrice,
        error: `Promo code "${cleanCode}" has reached its maximum usage limit.`,
      };
    }

    // Calculate discount amount based on PERCENTAGE or FIXED
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Number(((planPrice * coupon.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Number(Math.min(coupon.discountValue, planPrice).toFixed(2));
    }

    const finalPrice = Math.max(0, Number((planPrice - discountAmount).toFixed(2)));

    return {
      valid: true,
      code: cleanCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalPrice,
    };
  }

  /**
   * Calculates complete billing breakdown including discount, subtotal, tax (VAT), and total.
   */
  public async calculateBilling(
    basePrice: number,
    couponCode?: string,
    taxRatePercent = 0
  ): Promise<BillingCalculationResult> {
    let discountAmount = 0;
    let appliedCode: string | undefined = undefined;

    if (couponCode && couponCode.trim().length > 0) {
      const validation = await this.validateAndCalculateDiscount(couponCode, basePrice);
      if (validation.valid) {
        discountAmount = validation.discountAmount;
        appliedCode = validation.code;
      }
    }

    const subtotal = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));
    const taxAmount = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    return {
      basePrice,
      discountAmount,
      subtotal,
      taxRatePercent,
      taxAmount,
      totalAmount,
      currency: 'USD',
      appliedCouponCode: appliedCode,
    };
  }

  /**
   * Increments coupon usage count upon successful subscription payment.
   */
  public async redeemCoupon(code: string): Promise<boolean> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.couponsStore.get(cleanCode);
    if (!coupon) return false;

    coupon.usedCount += 1;
    coupon.updatedAt = new Date().toISOString();
    this.couponsStore.set(cleanCode, coupon);
    return true;
  }

  /**
   * Creates a new promotional coupon code.
   */
  public async createCoupon(dto: CreateCouponDTO, adminId = 'system'): Promise<Coupon> {
    const code = dto.code.trim().toUpperCase();
    if (this.couponsStore.has(code)) {
      throw new Error(`Coupon code "${code}" already exists.`);
    }

    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxUses: dto.maxUses ?? 100,
      usedCount: 0,
      validFrom: dto.validFrom || new Date().toISOString(),
      validUntil: dto.validUntil || null,
      isActive: dto.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.couponsStore.set(code, newCoupon);

    await auditService.logAdminAction({
      adminId,
      action: 'CREATE_COUPON',
      targetResource: `Coupon:${code}`,
      details: { discountType: newCoupon.discountType, discountValue: newCoupon.discountValue },
    });

    return newCoupon;
  }

  /**
   * Retrieves all registered promo coupons.
   */
  public async getCoupons(): Promise<Coupon[]> {
    return Array.from(this.couponsStore.values());
  }

  private seedInitialCoupons(): void {
    const seed: Coupon[] = [
      {
        id: 'cpn-01',
        code: 'WELCOME20',
        discountType: 'PERCENTAGE',
        discountValue: 20, // 20% OFF
        maxUses: 500,
        usedCount: 12,
        validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cpn-02',
        code: 'LAUNCH50',
        discountType: 'FIXED',
        discountValue: 50, // $50 OFF
        maxUses: 100,
        usedCount: 45,
        validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
        validUntil: new Date(Date.now() + 60 * 86400000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    seed.forEach((c) => this.couponsStore.set(c.code, c));
  }
}

export const couponService = CouponService.getInstance();
