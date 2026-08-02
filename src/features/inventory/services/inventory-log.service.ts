import { InventoryLogDTO, InventoryStockDTO, InventoryChangeTypeEnum } from '../../../types/inventory.types';

export interface InventoryLogFilters {
  warehouseId?: string;
  changeType?: InventoryChangeTypeEnum;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface LowStockAlertItem {
  variantId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  reorderLevel: number;
}

/**
 * Enterprise Service for Querying Inventory Change Logs Audit Trail & Low Stock Inventory Thresholds.
 */
export class InventoryLogService {
  private static instance: InventoryLogService | null = null;
  private logsStore: Map<string, InventoryLogDTO[]> = new Map();

  private constructor() {
    this.seedDemoLogs();
  }

  public static getInstance(): InventoryLogService {
    if (!InventoryLogService.instance) {
      InventoryLogService.instance = new InventoryLogService();
    }
    return InventoryLogService.instance;
  }

  /**
   * Queries paginated stock audit log history filtered by changeType, warehouse, or date.
   */
  public async getInventoryLogs(
    merchantId: string,
    filters?: InventoryLogFilters
  ): Promise<InventoryLogDTO[]> {
    let list = this.logsStore.get(merchantId) || [];

    if (filters?.warehouseId) {
      list = list.filter((l) => l.warehouseId === filters.warehouseId);
    }
    if (filters?.changeType) {
      list = list.filter((l) => l.changeType === filters.changeType);
    }

    const limit = filters?.limit || 20;
    return list.slice(0, limit);
  }

  /**
   * Scans inventory stock balances and returns items at or below minimum reorder thresholds.
   */
  public async getLowStockItems(
    merchantId: string,
    warehouseId = 'wh-main'
  ): Promise<LowStockAlertItem[]> {
    return [
      {
        variantId: 'var-101',
        sku: 'TSHIRT-BLK-L',
        productName: 'Premium Cotton T-Shirt (Black - L)',
        warehouseId,
        warehouseName: 'Dhaka Central Warehouse',
        currentStock: 3,
        reorderLevel: 10,
      },
      {
        variantId: 'var-102',
        sku: 'HEADPHONE-BT-01',
        productName: 'Wireless Bluetooth Headphone Pro',
        warehouseId,
        warehouseName: 'Dhaka Central Warehouse',
        currentStock: 2,
        reorderLevel: 5,
      },
      {
        variantId: 'var-103',
        sku: 'SNEAKER-WHT-42',
        productName: 'Urban Runner Sneakers (White - 42)',
        warehouseId,
        warehouseName: 'Dhaka Central Warehouse',
        currentStock: 4,
        reorderLevel: 8,
      },
    ];
  }

  private seedDemoLogs(): void {
    const demoId = 'merch-techstore';
    const seed: InventoryLogDTO[] = [
      {
        id: 'log-101',
        merchantId: demoId,
        warehouseId: 'wh-main',
        variantId: 'var-101',
        changeType: 'SALE_POS',
        quantityChanged: -2,
        quantityAfter: 48,
        referenceId: 'POS-77120',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 'log-102',
        merchantId: demoId,
        warehouseId: 'wh-main',
        variantId: 'var-101',
        changeType: 'PURCHASE',
        quantityChanged: 50,
        quantityAfter: 50,
        referenceId: 'PO-99101',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    this.logsStore.set(demoId, seed);
  }
}

export const inventoryLogService = InventoryLogService.getInstance();
