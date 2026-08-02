export interface BarcodeHistoryFilters {
  sku?: string;
  generatedBy?: string;
  limit?: number;
}

export interface BarcodePrintLogDTO {
  id: string;
  merchantId: string;
  variantId: string;
  sku: string;
  productName: string;
  barcodeType: string;
  quantityPrinted: number;
  generatedBy: string;
  labelTemplateName: string;
  createdAt: string;
}

/**
 * Enterprise Service for Querying Barcode Printing History and Cashier Audit Logs.
 */
export class BarcodeHistoryService {
  private static instance: BarcodeHistoryService | null = null;
  private historyStore: Map<string, BarcodePrintLogDTO[]> = new Map();

  private constructor() {
    this.seedDemoHistory();
  }

  public static getInstance(): BarcodeHistoryService {
    if (!BarcodeHistoryService.instance) {
      BarcodeHistoryService.instance = new BarcodeHistoryService();
    }
    return BarcodeHistoryService.instance;
  }

  /**
   * Queries barcode printing audit logs filtered by SKU, cashier, or date.
   */
  public async getPrintHistory(
    merchantId: string,
    filters?: BarcodeHistoryFilters
  ): Promise<BarcodePrintLogDTO[]> {
    let list = this.historyStore.get(merchantId) || [];

    if (filters?.sku) {
      const q = filters.sku.toLowerCase();
      list = list.filter((h) => h.sku.toLowerCase().includes(q) || h.productName.toLowerCase().includes(q));
    }
    if (filters?.generatedBy) {
      list = list.filter((h) => h.generatedBy === filters.generatedBy);
    }

    const limit = filters?.limit || 20;
    return list.slice(0, limit);
  }

  private seedDemoHistory(): void {
    const demoId = 'merch-techstore';
    const seed: BarcodePrintLogDTO[] = [
      {
        id: 'hist-101',
        merchantId: demoId,
        variantId: 'var-101',
        sku: 'SKU-TSHIRT-BLK-XL',
        productName: 'Premium Cotton T-Shirt (Black - XL)',
        barcodeType: 'CODE128',
        quantityPrinted: 50,
        generatedBy: 'cashier-jamal',
        labelTemplateName: 'Standard 50mm x 25mm Single Thermal Sticker',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'hist-102',
        merchantId: demoId,
        variantId: 'var-102',
        sku: 'SKU-HEADPHONE-PRO',
        productName: 'Wireless Bluetooth Headphone Pro',
        barcodeType: 'CODE128',
        quantityPrinted: 20,
        generatedBy: 'admin-user',
        labelTemplateName: 'Dual 38mm x 25mm 2-Up Thermal Sticker',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];
    this.historyStore.set(demoId, seed);
  }
}

export const barcodeHistoryService = BarcodeHistoryService.getInstance();
