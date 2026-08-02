import {
  HoldSalePayload,
  POSCartItem,
  POSHoldSaleDTO,
} from '../../../types/pos.types';

export interface ResumeSaleResult {
  holdSale: POSHoldSaleDTO;
  cartItems: POSCartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  holdNote?: string | null;
  stockWarnings: string[];
}

/**
 * Enterprise Service for Holding & Resuming POS Sales.
 * Manages counter cart snapshots, hold notes, and stock validation upon resumption.
 */
export class HoldSaleService {
  private static instance: HoldSaleService | null = null;
  // In-memory hold sales store: Map<merchantId, POSHoldSaleDTO[]>
  private holdStore: Map<string, POSHoldSaleDTO[]> = new Map();

  private constructor() {
    this.seedDemoHoldSales();
  }

  public static getInstance(): HoldSaleService {
    if (!HoldSaleService.instance) {
      HoldSaleService.instance = new HoldSaleService();
    }
    return HoldSaleService.instance;
  }

  /**
   * Holds an active POS cart sale snapshot.
   */
  public async holdSale(payload: HoldSalePayload): Promise<POSHoldSaleDTO> {
    const list = this.holdStore.get(payload.merchantId) || [];
    const holdSaleId = `pos-hold-${Date.now()}`;

    const newHoldSale: POSHoldSaleDTO = {
      id: holdSaleId,
      merchantId: payload.merchantId,
      registerId: payload.registerId,
      cashierId: payload.cashierId,
      customerId: payload.customerId || null,
      cartData: {
        ...payload,
        id: holdSaleId,
        createdAt: new Date().toISOString(),
      },
      holdNote: payload.holdNote || null,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newHoldSale); // Newest held sales first
    this.holdStore.set(payload.merchantId, list);

    return newHoldSale;
  }

  /**
   * Lists all held sales for a merchant and optional register filter.
   */
  public async listHeldSales(
    merchantId: string,
    registerId?: string
  ): Promise<POSHoldSaleDTO[]> {
    const list = this.holdStore.get(merchantId) || [];
    if (registerId) {
      return list.filter((item) => item.registerId === registerId);
    }
    return list;
  }

  /**
   * Retrieves a held sale by ID.
   */
  public async getHeldSaleById(
    merchantId: string,
    holdSaleId: string
  ): Promise<POSHoldSaleDTO | null> {
    const list = this.holdStore.get(merchantId) || [];
    return list.find((item) => item.id === holdSaleId) || null;
  }

  /**
   * Resumes a held sale into the active POS cart and removes it from hold store.
   */
  public async resumeSale(
    merchantId: string,
    holdSaleId: string,
    stockMap?: Record<string, number>
  ): Promise<ResumeSaleResult> {
    const list = this.holdStore.get(merchantId) || [];
    const index = list.findIndex((item) => item.id === holdSaleId);

    if (index === -1) {
      throw new Error(`Held sale with ID "${holdSaleId}" not found or already resumed.`);
    }

    const holdSale = list[index];
    const payload = holdSale.cartData as HoldSalePayload;
    const cartItems = payload.cartItems || [];
    const stockWarnings: string[] = [];

    // Validate inventory stock availability
    if (stockMap) {
      for (const item of cartItems) {
        const availableStock = stockMap[item.variantId];
        if (availableStock !== undefined) {
          if (availableStock <= 0) {
            stockWarnings.push(
              `Item "${item.productName} (${item.variantName})" is now OUT OF STOCK (Available: 0).`
            );
          } else if (availableStock < item.quantity) {
            stockWarnings.push(
              `Item "${item.productName} (${item.variantName})" stock updated to ${availableStock} (Requested: ${item.quantity}).`
            );
          }
        }
      }
    }

    // Remove from hold store upon successful resumption
    list.splice(index, 1);
    this.holdStore.set(merchantId, list);

    return {
      holdSale,
      cartItems,
      subtotal: payload.subtotal || 0,
      discountAmount: payload.discountAmount || 0,
      taxAmount: payload.taxAmount || 0,
      grandTotal: payload.grandTotal || 0,
      holdNote: holdSale.holdNote,
      stockWarnings,
    };
  }

  /**
   * Deletes a held sale entry without resuming.
   */
  public async deleteHoldSale(merchantId: string, holdSaleId: string): Promise<boolean> {
    const list = this.holdStore.get(merchantId) || [];
    const filtered = list.filter((item) => item.id !== holdSaleId);
    if (filtered.length !== list.length) {
      this.holdStore.set(merchantId, filtered);
      return true;
    }
    return false;
  }

  /**
   * Clears all held sales for a specific register.
   */
  public async clearRegisterHoldSales(merchantId: string, registerId: string): Promise<void> {
    const list = this.holdStore.get(merchantId) || [];
    const remaining = list.filter((item) => item.registerId !== registerId);
    this.holdStore.set(merchantId, remaining);
  }

  private seedDemoHoldSales(): void {
    const demoMerchantId = 'merch-techstore';
    const demoRegisterId = 'reg-counter-01';

    const sampleHoldPayload: HoldSalePayload = {
      merchantId: demoMerchantId,
      registerId: demoRegisterId,
      cashierId: 'cashier-demo-01',
      customerName: 'Karim Ahmed',
      cartItems: [
        {
          variantId: 'var-101',
          productId: 'prod-1',
          productName: 'iPhone 15 Pro Silicone Case',
          variantName: 'Black / M',
          sku: 'SKU-IPHONE-CASE-BLK',
          barcode: '8809123456789',
          unitPrice: 1500,
          costPrice: 800,
          quantity: 2,
          discount: 100,
          discountType: 'FIXED',
          taxRate: 5,
          lineTotal: 2900,
        },
      ],
      subtotal: 2900,
      discountAmount: 100,
      taxAmount: 140,
      grandTotal: 2940,
      holdNote: 'Customer left for cash withdrawal at ATM',
      createdAt: new Date().toISOString(),
    };

    this.holdStore.set(demoMerchantId, [
      {
        id: 'pos-hold-demo-1',
        merchantId: demoMerchantId,
        registerId: demoRegisterId,
        cashierId: 'cashier-demo-01',
        customerId: 'cust-101',
        cartData: sampleHoldPayload,
        holdNote: sampleHoldPayload.holdNote,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export const holdSaleService = HoldSaleService.getInstance();
