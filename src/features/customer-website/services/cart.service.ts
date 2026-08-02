import { CartState, StorefrontCartItem } from '../../../types/customer-website.types';

export interface CouponValidationResult {
  isValid: boolean;
  code?: string;
  discountAmount: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  message: string;
}

export interface CouponRule {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  isActive: boolean;
  validUntil?: string;
}

/**
 * Enterprise Service for Storefront Cart Calculations, Coupon Code Verification, and Discount Rules.
 */
export class StorefrontCartService {
  private static instance: StorefrontCartService | null = null;
  private couponsStore: Map<string, CouponRule> = new Map();

  private constructor() {
    this.seedDemoCoupons();
  }

  public static getInstance(): StorefrontCartService {
    if (!StorefrontCartService.instance) {
      StorefrontCartService.instance = new StorefrontCartService();
    }
    return StorefrontCartService.instance;
  }

  /**
   * Recalculates cart subtotal, item count, coupon discount, shipping fee, and grand total.
   */
  public calculateCartTotals(
    items: StorefrontCartItem[],
    couponCode?: string | null,
    shippingFee: number = 0
  ): CartState {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      const lineGross = item.unitPrice * item.quantity;
      item.lineTotal = Math.round(lineGross * 100) / 100;
      subtotal += item.lineTotal;
      itemCount += item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const couponRes = this.validateCoupon(couponCode, subtotal);
      if (couponRes.isValid) {
        discountAmount = couponRes.discountAmount;
        validCouponCode = couponRes.code || couponCode;
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const cleanShipping = Math.round(shippingFee * 100) / 100;
    const grandTotal = Math.max(0, Math.round((subtotal - discountAmount + cleanShipping) * 100) / 100);

    return {
      items,
      couponCode: validCouponCode,
      discountAmount,
      shippingFee: cleanShipping,
      subtotal,
      grandTotal,
      itemCount,
    };
  }

  /**
   * Validates a promotional coupon code against order subtotal.
   */
  public validateCoupon(couponCode: string, subtotal: number): CouponValidationResult {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = this.couponsStore.get(cleanCode);

    if (!coupon || !coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Invalid or expired coupon code "${couponCode}".`,
      };
    }

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Coupon "${cleanCode}" requires a minimum spend of ৳${coupon.minSpend}.`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(subtotal, Math.round(discountAmount * 100) / 100);

    return {
      isValid: true,
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      message: `Coupon "${coupon.code}" applied successfully! You saved ৳${discountAmount}.`,
    };
  }

  private seedDemoCoupons(): void {
    this.couponsStore.set('EID2026', {
      code: 'EID2026',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minSpend: 1000,
      maxDiscount: 500,
      isActive: true,
    });

    this.couponsStore.set('WELCOME50', {
      code: 'WELCOME50',
      discountType: 'FIXED',
      discountValue: 50,
      minSpend: 300,
      isActive: true,
    });

    this.couponsStore.set('SUPERDEAL', {
      code: 'SUPERDEAL',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minSpend: 2000,
      maxDiscount: 1000,
      isActive: true,
    });
  }
}

}

export const storefrontCartService = StorefrontCartService.getInstance();

export function calculateCartTotals(
  items: Array<{ productId: string; title: string; price: number; quantity: number }>,
  discountAmount: number = 0,
  shippingZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA' = 'INSIDE_DHAKA'
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = shippingZone === 'INSIDE_DHAKA' ? 70 : 130;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  return {
    subtotal,
    shippingFee,
    discountAmount,
    grandTotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

