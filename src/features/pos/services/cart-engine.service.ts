import { POSCartItem } from '../../../types/pos.types';
import { ProductDTO, ProductVariantDTO } from '../../../types/inventory.types';

export interface CartDiscountOption {
  value: number;
  type: 'PERCENTAGE' | 'FIXED';
}

export interface CalculatedCartSummary {
  subtotal: number;
  itemDiscountTotal: number;
  cartDiscountTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  totalItemsCount: number;
}

export interface ChangeDueResult {
  paidAmount: number;
  grandTotal: number;
  changeDue: number;
  remainingDue: number;
  isFullyPaid: boolean;
}

export interface BarcodeMatchResult {
  found: boolean;
  matchedVariant?: ProductVariantDTO;
  matchedProduct?: ProductDTO;
  availableStock?: number;
  isOutOfStock?: boolean;
  message?: string;
}

/**
 * High-Speed In-Memory POS Cart Calculator Engine.
 * Optimized for sub-millisecond barcode scanning and counter checkout calculations.
 */
export class CartEngineService {
  private static instance: CartEngineService | null = null;

  private constructor() {}

  public static getInstance(): CartEngineService {
    if (!CartEngineService.instance) {
      CartEngineService.instance = new CartEngineService();
    }
    return CartEngineService.instance;
  }

  /**
   * Recalculates all cart totals in real-time.
   */
  public calculateCartTotals(
    items: POSCartItem[],
    cartDiscount: CartDiscountOption = { value: 0, type: 'FIXED' },
    taxRatePercentage: number = 0
  ): CalculatedCartSummary {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let totalItemsCount = 0;

    // Calculate item level subtotal & discounts
    for (const item of items) {
      const lineGross = item.unitPrice * item.quantity;
      let itemDiscountAmount = 0;

      if (item.discountType === 'PERCENTAGE') {
        itemDiscountAmount = lineGross * (item.discount / 100);
      } else {
        itemDiscountAmount = item.discount * item.quantity;
      }

      // Ensure discount doesn't exceed gross line price
      itemDiscountAmount = Math.min(lineGross, itemDiscountAmount);
      const lineTotal = Math.max(0, lineGross - itemDiscountAmount);

      item.lineTotal = Math.round(lineTotal * 100) / 100;
      subtotal += item.lineTotal;
      itemDiscountTotal += itemDiscountAmount;
      totalItemsCount += item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    itemDiscountTotal = Math.round(itemDiscountTotal * 100) / 100;

    // Calculate cart level discount
    let cartDiscountTotal = 0;
    if (cartDiscount.value > 0) {
      if (cartDiscount.type === 'PERCENTAGE') {
        cartDiscountTotal = subtotal * (cartDiscount.value / 100);
      } else {
        cartDiscountTotal = cartDiscount.value;
      }
      cartDiscountTotal = Math.min(subtotal, cartDiscountTotal);
    }
    cartDiscountTotal = Math.round(cartDiscountTotal * 100) / 100;

    const totalDiscount = Math.round((itemDiscountTotal + cartDiscountTotal) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - cartDiscountTotal);

    // Calculate Tax / VAT
    let taxTotal = 0;
    if (taxRatePercentage > 0) {
      taxTotal = taxableAmount * (taxRatePercentage / 100);
    }
    taxTotal = Math.round(taxTotal * 100) / 100;

    const grandTotal = Math.round((taxableAmount + taxTotal) * 100) / 100;

    return {
      subtotal,
      itemDiscountTotal,
      cartDiscountTotal,
      totalDiscount,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxTotal,
      grandTotal,
      totalItemsCount,
    };
  }

  /**
   * Calculates cash change due or remaining balance for POS checkout.
   */
  public calculateChangeDue(grandTotal: number, paidAmount: number): ChangeDueResult {
    const cleanGrand = Math.round(grandTotal * 100) / 100;
    const cleanPaid = Math.round(paidAmount * 100) / 100;
    const diff = cleanPaid - cleanGrand;

    const changeDue = diff > 0 ? Math.round(diff * 100) / 100 : 0;
    const remainingDue = diff < 0 ? Math.round(Math.abs(diff) * 100) / 100 : 0;

    return {
      paidAmount: cleanPaid,
      grandTotal: cleanGrand,
      changeDue,
      remainingDue,
      isFullyPaid: diff >= 0,
    };
  }

  /**
   * Instant product lookup by Barcode or SKU for fast counter scanner listeners.
   */
  public matchProductByBarcodeOrSKU(
    query: string,
    availableProducts: ProductDTO[],
    stockMap?: Record<string, number>
  ): BarcodeMatchResult {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return { found: false, message: 'Empty barcode query' };
    }

    for (const product of availableProducts) {
      if (!product.isActive) continue;

      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const matchSKU = variant.sku.toLowerCase() === cleanQuery;
          const matchBarcode = variant.barcode && variant.barcode.toLowerCase() === cleanQuery;

          if (matchSKU || matchBarcode) {
            const availableStock = stockMap?.[variant.id] ?? 999;
            const isOutOfStock = availableStock <= 0;

            return {
              found: true,
              matchedVariant: variant,
              matchedProduct: product,
              availableStock,
              isOutOfStock,
              message: isOutOfStock
                ? `Warning: ${product.name} (${variant.variantName}) is out of stock!`
                : `Matched ${product.name} - ${variant.variantName}`,
            };
          }
        }
      }
    }

    return { found: false, message: `No product found matching barcode/SKU "${query}"` };
  }

  /**
   * Adds or increments an item in the cart array.
   */
  public addItemToCart(
    currentItems: POSCartItem[],
    matchedVariant: ProductVariantDTO,
    matchedProduct: ProductDTO,
    quantityToAdd: number = 1,
    taxRate: number = 0
  ): { updatedItems: POSCartItem[]; stockWarning?: string } {
    const existingIndex = currentItems.findIndex((item) => item.variantId === matchedVariant.id);
    const newItems = [...currentItems];
    let stockWarning: string | undefined;

    if (existingIndex > -1) {
      const existingItem = newItems[existingIndex];
      const newQty = existingItem.quantity + quantityToAdd;
      newItems[existingIndex] = {
        ...existingItem,
        quantity: newQty,
      };
    } else {
      const newItem: POSCartItem = {
        variantId: matchedVariant.id,
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        variantName: matchedVariant.variantName,
        sku: matchedVariant.sku,
        barcode: matchedVariant.barcode,
        unitPrice: matchedVariant.sellingPrice,
        costPrice: matchedVariant.costPrice,
        quantity: quantityToAdd,
        discount: 0,
        discountType: 'FIXED',
        taxRate,
        lineTotal: matchedVariant.sellingPrice * quantityToAdd,
      };
      newItems.push(newItem);
    }

    return { updatedItems: newItems, stockWarning };
  }

  /**
   * Updates line item quantity directly in the cart.
   */
  public updateItemQuantity(
    currentItems: POSCartItem[],
    variantId: string,
    quantity: number
  ): POSCartItem[] {
    if (quantity <= 0) {
      return this.removeItemFromCart(currentItems, variantId);
    }
    return currentItems.map((item) => (item.variantId === variantId ? { ...item, quantity } : item));
  }

  /**
   * Removes an item from the cart array.
   */
  public removeItemFromCart(currentItems: POSCartItem[], variantId: string): POSCartItem[] {
    return currentItems.filter((item) => item.variantId !== variantId);
  }

  /**
   * Applies line item discount (Percentage or Fixed BDT).
   */
  public applyItemDiscount(
    currentItems: POSCartItem[],
    variantId: string,
    discount: number,
    discountType: 'PERCENTAGE' | 'FIXED'
  ): POSCartItem[] {
    return currentItems.map((item) =>
      item.variantId === variantId
        ? { ...item, discount: Math.max(0, discount), discountType }
        : item
    );
  }
}

export const cartEngineService = CartEngineService.getInstance();
