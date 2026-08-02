import {
  POSOrderDTO,
  POSPaymentMethodType,
  POSRefundExchangeDTO,
  POSRefundItem,
} from '../../../types/pos.types';
import { InventoryLogDTO } from '../../../types/inventory.types';
import { checkoutService } from './checkout.service';

export interface ReturnedItemPayload {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  restock: boolean;
}

export interface ExchangeItemPayload {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
}

export interface POSRefundExchangePayload {
  merchantId: string;
  originalOrderId: string;
  processedBy: string;
  processorName?: string;
  reason: string;
  returnedItems: ReturnedItemPayload[];
  exchangeItems?: ExchangeItemPayload[];
  refundPaymentMethod?: POSPaymentMethodType;
  registerId?: string;
  sessionId?: string;
  warehouseId?: string;
}

export interface POSRefundResult {
  success: boolean;
  refundRecord: POSRefundExchangeDTO;
  exchangeOrder?: POSOrderDTO;
  netDifference: number; // Positive = Customer owes money, Negative = Merchant refunds customer
  refundAmountToCustomer: number;
  additionalAmountDue: number;
  inventoryLogs: InventoryLogDTO[];
  message: string;
}

/**
 * Enterprise Service for POS Refund & Product Exchange Processing.
 * Handles calculation of price differences, inventory restocking, exchange checkout, and audit history.
 */
export class RefundService {
  private static instance: RefundService | null = null;
  private refundsStore: Map<string, POSRefundExchangeDTO[]> = new Map();

  private constructor() {}

  public static getInstance(): RefundService {
    if (!RefundService.instance) {
      RefundService.instance = new RefundService();
    }
    return RefundService.instance;
  }

  /**
   * Processes an Item Refund or Product Exchange atomically.
   */
  public async processRefundExchange(
    payload: POSRefundExchangePayload,
    stockMap?: Map<string, number>
  ): Promise<POSRefundResult> {
    const {
      merchantId,
      originalOrderId,
      processedBy,
      processorName,
      reason,
      returnedItems,
      exchangeItems = [],
      refundPaymentMethod = 'CASH',
      registerId,
      sessionId,
      warehouseId = 'wh-main',
    } = payload;

    // 1. Fetch Original Order
    const originalOrder = await checkoutService.getOrderById(merchantId, originalOrderId);
    if (!originalOrder) {
      throw new Error(`Original POS Order "${originalOrderId}" not found.`);
    }

    if (!returnedItems || returnedItems.length === 0) {
      throw new Error('At least one item must be selected for return or exchange.');
    }

    // 2. Calculate Return Total
    let totalReturnAmount = 0;
    const formattedRefundItems: POSRefundItem[] = [];

    for (const ret of returnedItems) {
      const lineRefund = Math.round(ret.quantity * ret.unitPrice * 100) / 100;
      totalReturnAmount += lineRefund;
      formattedRefundItems.push({
        variantId: ret.variantId,
        productName: `${ret.productName} (${ret.variantName})`,
        quantity: ret.quantity,
        unitPrice: ret.unitPrice,
        refundAmount: lineRefund,
        reason,
      });
    }

    totalReturnAmount = Math.round(totalReturnAmount * 100) / 100;

    // 3. Calculate Exchange Total
    let totalExchangeAmount = 0;
    for (const exc of exchangeItems) {
      totalExchangeAmount += Math.round(exc.quantity * exc.unitPrice * 100) / 100;
    }
    totalExchangeAmount = Math.round(totalExchangeAmount * 100) / 100;

    // 4. Calculate Net Price Difference
    const netDifference = Math.round((totalExchangeAmount - totalReturnAmount) * 100) / 100;
    const refundAmountToCustomer = netDifference < 0 ? Math.abs(netDifference) : 0;
    const additionalAmountDue = netDifference > 0 ? netDifference : 0;

    const inventoryLogs: InventoryLogDTO[] = [];

    // 5. Restock Returned Items if requested ('RETURN')
    for (const ret of returnedItems) {
      if (ret.restock) {
        const currentStock = stockMap?.get(ret.variantId) ?? 50;
        const quantityAfter = currentStock + ret.quantity;

        if (stockMap) {
          stockMap.set(ret.variantId, quantityAfter);
        }

        inventoryLogs.push({
          id: `inv-log-ret-${Date.now()}-${ret.variantId.slice(-4)}`,
          merchantId,
          warehouseId,
          variantId: ret.variantId,
          changeType: 'RETURN',
          quantityChanged: ret.quantity,
          quantityAfter,
          referenceId: originalOrder.orderNumber,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 6. Process Exchange New Order if items exist
    let exchangeOrder: POSOrderDTO | undefined;
    if (exchangeItems.length > 0) {
      const checkoutRes = await checkoutService.processPOSCheckout(
        {
          merchantId,
          registerId: registerId || originalOrder.registerId,
          sessionId: sessionId || originalOrder.sessionId,
          cashierId: processedBy,
          cashierName: processorName || originalOrder.cashierName,
          customerId: originalOrder.customerId,
          cartItems: exchangeItems.map((e) => ({
            variantId: e.variantId,
            productId: e.productId,
            productName: e.productName,
            variantName: e.variantName,
            sku: e.sku,
            unitPrice: e.unitPrice,
            costPrice: e.costPrice || 0,
            quantity: e.quantity,
            discount: 0,
            discountType: 'FIXED',
            taxRate: 0,
            lineTotal: e.quantity * e.unitPrice,
          })),
          subtotal: totalExchangeAmount,
          discountAmount: 0,
          taxAmount: 0,
          grandTotal: totalExchangeAmount,
          paymentSplits: [
            {
              paymentMethod: refundPaymentMethod,
              amount: totalExchangeAmount,
              transactionReference: `EXCHANGE-FOR-${originalOrder.orderNumber}`,
            },
          ],
          notes: `Exchange order for original #${originalOrder.orderNumber}. Reason: ${reason}`,
          warehouseId,
        },
        stockMap
      );

      exchangeOrder = checkoutRes.order;
      inventoryLogs.push(...checkoutRes.inventoryLogs);
    }

    // 7. Update Original Order Status
    originalOrder.fulfillmentStatus = exchangeItems.length > 0 ? 'EXCHANGED' : 'REFUNDED';

    // 8. Record POSRefundExchange
    const refundRecordId = `pos-ref-${Date.now()}`;
    const refundRecord: POSRefundExchangeDTO = {
      id: refundRecordId,
      originalOrderId: originalOrder.id,
      newOrderId: exchangeOrder?.id || null,
      refundedAmount: totalReturnAmount,
      reason,
      items: formattedRefundItems,
      processedBy,
      processorName: processorName || 'Cashier',
      createdAt: new Date().toISOString(),
    };

    const existingList = this.refundsStore.get(merchantId) || [];
    existingList.unshift(refundRecord);
    this.refundsStore.set(merchantId, existingList);

    let summaryMessage = `Processed refund for Order #${originalOrder.orderNumber}. Total Refund: ৳${totalReturnAmount}`;
    if (exchangeItems.length > 0) {
      if (additionalAmountDue > 0) {
        summaryMessage = `Exchange processed. Customer owes additional ৳${additionalAmountDue}.`;
      } else if (refundAmountToCustomer > 0) {
        summaryMessage = `Exchange processed. Refunded ৳${refundAmountToCustomer} to customer.`;
      } else {
        summaryMessage = `Even Exchange completed successfully.`;
      }
    }

    return {
      success: true,
      refundRecord,
      exchangeOrder,
      netDifference,
      refundAmountToCustomer,
      additionalAmountDue,
      inventoryLogs,
      message: summaryMessage,
    };
  }

  /**
   * Retrieves refund history for a merchant.
   */
  public async getRefundsHistory(merchantId: string): Promise<POSRefundExchangeDTO[]> {
    return this.refundsStore.get(merchantId) || [];
  }
}

export const refundService = RefundService.getInstance();
