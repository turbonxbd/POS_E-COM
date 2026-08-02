import {
  StockAdjustmentDTO,
  AdjustmentTypeEnum,
  AdjustmentReasonEnum,
  InventoryLogDTO,
} from '../../../types/inventory.types';

export interface AdjustStockPayload {
  warehouseId: string;
  variantId: string;
  adjustmentType: AdjustmentTypeEnum;
  quantity: number;
  reason: AdjustmentReasonEnum;
  notes?: string;
  createdBy?: string;
}

export interface AdjustStockResult {
  success: boolean;
  adjustmentRecord: StockAdjustmentDTO;
  inventoryLog: InventoryLogDTO;
  newQuantity: number;
}

/**
 * Enterprise Service for Managing Atomic Stock Adjustments (Damage, Loss, Expired, Stock Count Corrections).
 */
export class StockAdjustmentService {
  private static instance: StockAdjustmentService | null = null;

  // In-Memory stock balances & logs store
  private stockBalances: Map<string, number> = new Map(); // `${warehouseId}:${variantId}` -> qty
  private adjustmentsStore: Map<string, StockAdjustmentDTO[]> = new Map();
  private logsStore: Map<string, InventoryLogDTO[]> = new Map();

  private constructor() {
    this.seedInitialBalances();
  }

  public static getInstance(): StockAdjustmentService {
    if (!StockAdjustmentService.instance) {
      StockAdjustmentService.instance = new StockAdjustmentService();
    }
    return StockAdjustmentService.instance;
  }

  /**
   * Atomically adjusts stock quantity in a warehouse and writes an audit log entry.
   */
  public async adjustStock(
    merchantId: string,
    payload: AdjustStockPayload
  ): Promise<AdjustStockResult> {
    const stockKey = `${payload.warehouseId}:${payload.variantId}`;
    const currentQty = this.stockBalances.get(stockKey) || 50; // Default baseline 50

    let newQuantity = currentQty;

    if (payload.adjustmentType === 'ADD') {
      newQuantity += payload.quantity;
    } else if (payload.adjustmentType === 'SUBTRACT') {
      newQuantity = Math.max(0, currentQty - payload.quantity);
    } else if (payload.adjustmentType === 'SET') {
      newQuantity = payload.quantity;
    }

    const quantityChanged = newQuantity - currentQty;
    this.stockBalances.set(stockKey, newQuantity);

    const adjRecord: StockAdjustmentDTO = {
      id: `adj-${Date.now()}`,
      merchantId,
      warehouseId: payload.warehouseId,
      variantId: payload.variantId,
      adjustmentType: payload.adjustmentType,
      quantity: payload.quantity,
      reason: payload.reason,
      notes: payload.notes || null,
      createdBy: payload.createdBy || 'staff-user',
      createdAt: new Date().toISOString(),
    };

    const logRecord: InventoryLogDTO = {
      id: `log-${Date.now()}`,
      merchantId,
      warehouseId: payload.warehouseId,
      variantId: payload.variantId,
      changeType: 'ADJUSTMENT',
      quantityChanged,
      quantityAfter: newQuantity,
      referenceId: adjRecord.id,
      createdAt: new Date().toISOString(),
    };

    // Save adjustment & log records
    const adjList = this.adjustmentsStore.get(merchantId) || [];
    adjList.push(adjRecord);
    this.adjustmentsStore.set(merchantId, adjList);

    const logList = this.logsStore.get(merchantId) || [];
    logList.push(logRecord);
    this.logsStore.set(merchantId, logList);

    return {
      success: true,
      adjustmentRecord: adjRecord,
      inventoryLog: logRecord,
      newQuantity,
    };
  }

  /**
   * Retrieves current stock balance for a variant in a warehouse.
   */
  public getStockBalance(warehouseId: string, variantId: string): number {
    const stockKey = `${warehouseId}:${variantId}`;
    return this.stockBalances.get(stockKey) || 50;
  }

  private seedInitialBalances(): void {
    this.stockBalances.set('wh-main:var-101', 50);
  }
}

export const stockAdjustmentService = StockAdjustmentService.getInstance();
