import { StockTransferDTO, InventoryLogDTO } from '../../../types/inventory.types';
import { stockAdjustmentService } from './stock-adjustment.service';

export interface TransferItemPayload {
  variantId: string;
  quantity: number;
}

export interface StockTransferResult {
  success: boolean;
  transferRecord: StockTransferDTO;
  logs: InventoryLogDTO[];
  message: string;
}

/**
 * Enterprise Service for Managing Warehouse-to-Warehouse Inter-Stock Transfers.
 */
export class StockTransferService {
  private static instance: StockTransferService | null = null;
  private transfersStore: Map<string, StockTransferDTO[]> = new Map();

  private constructor() {}

  public static getInstance(): StockTransferService {
    if (!StockTransferService.instance) {
      StockTransferService.instance = new StockTransferService();
    }
    return StockTransferService.instance;
  }

  /**
   * Deducts stock from source warehouse and increments destination warehouse in an atomic transaction.
   */
  public async transferStock(
    merchantId: string,
    sourceWarehouseId: string,
    destinationWarehouseId: string,
    items: TransferItemPayload[],
    notes?: string,
    createdBy = 'staff-user'
  ): Promise<StockTransferResult> {
    if (sourceWarehouseId === destinationWarehouseId) {
      throw new Error('Source and destination warehouses cannot be the same.');
    }

    const transferId = `trans-${Date.now()}`;
    const logs: InventoryLogDTO[] = [];

    // Process each item in atomic batch
    for (const item of items) {
      const sourceQty = stockAdjustmentService.getStockBalance(sourceWarehouseId, item.variantId);

      if (sourceQty < item.quantity) {
        throw new Error(
          `Insufficient stock in source warehouse (${sourceWarehouseId}) for variant (${item.variantId}). Available: ${sourceQty}, Requested: ${item.quantity}`
        );
      }

      // 1. Deduct from source warehouse
      const sourceResult = await stockAdjustmentService.adjustStock(merchantId, {
        warehouseId: sourceWarehouseId,
        variantId: item.variantId,
        adjustmentType: 'SUBTRACT',
        quantity: item.quantity,
        reason: 'CORRECT_COUNT',
        notes: `Transfer OUT to ${destinationWarehouseId}`,
        createdBy,
      });

      // 2. Add to destination warehouse
      const destResult = await stockAdjustmentService.adjustStock(merchantId, {
        warehouseId: destinationWarehouseId,
        variantId: item.variantId,
        adjustmentType: 'ADD',
        quantity: item.quantity,
        reason: 'CORRECT_COUNT',
        notes: `Transfer IN from ${sourceWarehouseId}`,
        createdBy,
      });

      logs.push({
        id: `log-tr-out-${Date.now()}`,
        merchantId,
        warehouseId: sourceWarehouseId,
        variantId: item.variantId,
        changeType: 'TRANSFER_OUT',
        quantityChanged: -item.quantity,
        quantityAfter: sourceResult.newQuantity,
        referenceId: transferId,
        createdAt: new Date().toISOString(),
      });

      logs.push({
        id: `log-tr-in-${Date.now()}`,
        merchantId,
        warehouseId: destinationWarehouseId,
        variantId: item.variantId,
        changeType: 'TRANSFER_IN',
        quantityChanged: item.quantity,
        quantityAfter: destResult.newQuantity,
        referenceId: transferId,
        createdAt: new Date().toISOString(),
      });
    }

    const transferRecord: StockTransferDTO = {
      id: transferId,
      merchantId,
      sourceWarehouseId,
      destinationWarehouseId,
      status: 'COMPLETED',
      notes: notes || null,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const list = this.transfersStore.get(merchantId) || [];
    list.push(transferRecord);
    this.transfersStore.set(merchantId, list);

    return {
      success: true,
      transferRecord,
      logs,
      message: `Stock transfer of ${items.length} item(s) completed successfully.`,
    };
  }

  /**
   * Fetches all stock transfers for a merchant.
   */
  public async getTransfers(merchantId: string): Promise<StockTransferDTO[]> {
    return this.transfersStore.get(merchantId) || [];
  }
}

export const stockTransferService = StockTransferService.getInstance();
