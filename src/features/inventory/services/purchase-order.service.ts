import { PurchaseOrderDTO, POPaymentStatusType, POStatusType } from '../../../types/inventory.types';
import { stockAdjustmentService } from './stock-adjustment.service';

export interface POItemPayload {
  variantId: string;
  quantity: number;
  costPrice: number;
}

export interface CreatePOPayload {
  supplierId: string;
  warehouseId: string;
  items: POItemPayload[];
  notes?: string;
}

export interface ReceivePOResult {
  success: boolean;
  purchaseOrder: PurchaseOrderDTO;
  receivedItemsCount: number;
  message: string;
}

/**
 * Enterprise Service for Supplier Purchase Orders and Automated Receiving Stock Updates.
 */
export class PurchaseOrderService {
  private static instance: PurchaseOrderService | null = null;
  private poStore: Map<string, (PurchaseOrderDTO & { items: POItemPayload[] })[]> = new Map();

  private constructor() {
    this.seedDemoPOs();
  }

  public static getInstance(): PurchaseOrderService {
    if (!PurchaseOrderService.instance) {
      PurchaseOrderService.instance = new PurchaseOrderService();
    }
    return PurchaseOrderService.instance;
  }

  /**
   * Fetches all purchase orders for a merchant.
   */
  public async getPurchaseOrders(merchantId: string): Promise<PurchaseOrderDTO[]> {
    const list = this.poStore.get(merchantId) || [];
    return list.map(({ items, ...po }) => po);
  }

  /**
   * Creates a new Purchase Order to a supplier.
   */
  public async createPurchaseOrder(
    merchantId: string,
    payload: CreatePOPayload
  ): Promise<PurchaseOrderDTO> {
    const list = this.poStore.get(merchantId) || [];
    const poId = `po-${Date.now()}`;
    const orderNumber = `PO-${Date.now().toString().substring(4)}`;

    const totalAmount = payload.items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);

    const newPO: PurchaseOrderDTO & { items: POItemPayload[] } = {
      id: poId,
      merchantId,
      supplierId: payload.supplierId,
      warehouseId: payload.warehouseId,
      orderNumber,
      totalAmount,
      paymentStatus: 'UNPAID',
      status: 'ORDERED',
      items: payload.items,
      createdAt: new Date().toISOString(),
    };

    list.push(newPO);
    this.poStore.set(merchantId, list);

    const { items, ...poData } = newPO;
    return poData;
  }

  /**
   * Marks Purchase Order as RECEIVED, automatically updates stock quantities in target warehouse, and logs PURCHASE audit trail.
   */
  public async receivePurchaseOrder(merchantId: string, poId: string): Promise<ReceivePOResult> {
    const list = this.poStore.get(merchantId) || [];
    const index = list.findIndex((p) => p.id === poId);

    if (index === -1) {
      throw new Error(`Purchase Order ID "${poId}" not found.`);
    }

    const targetPO = list[index];
    if (targetPO.status === 'RECEIVED') {
      throw new Error(`Purchase Order "${targetPO.orderNumber}" is already received.`);
    }

    // Automatically update inventory stock for received PO items
    for (const item of targetPO.items) {
      await stockAdjustmentService.adjustStock(merchantId, {
        warehouseId: targetPO.warehouseId,
        variantId: item.variantId,
        adjustmentType: 'ADD',
        quantity: item.quantity,
        reason: 'CORRECT_COUNT',
        notes: `PO Received: ${targetPO.orderNumber}`,
        createdBy: 'system-po-receiving',
      });
    }

    targetPO.status = 'RECEIVED';
    targetPO.paymentStatus = 'PAID';
    list[index] = targetPO;
    this.poStore.set(merchantId, list);

    const { items, ...poData } = targetPO;

    return {
      success: true,
      purchaseOrder: poData,
      receivedItemsCount: targetPO.items.length,
      message: `Purchase Order "${targetPO.orderNumber}" received. Inventory stock updated for ${targetPO.items.length} item(s).`,
    };
  }

  private seedDemoPOs(): void {
    const demoId = 'merch-techstore';
    const seed = [
      {
        id: 'po-1001',
        merchantId: demoId,
        supplierId: 'sup-1',
        warehouseId: 'wh-main',
        orderNumber: 'PO-99101',
        totalAmount: 140000,
        paymentStatus: 'PAID' as POPaymentStatusType,
        status: 'RECEIVED' as POStatusType,
        items: [{ variantId: 'var-101', quantity: 100, costPrice: 1400 }],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    this.poStore.set(demoId, seed);
  }
}

export const purchaseOrderService = PurchaseOrderService.getInstance();
