import {
  POSCartItem,
  POSOrderDTO,
  POSPaymentDTO,
  POSPaymentSplit,
  POSPaymentStatusType,
} from '../../../types/pos.types';
import { InventoryLogDTO } from '../../../types/inventory.types';

export interface POSCheckoutPayload {
  merchantId: string;
  registerId: string;
  sessionId: string;
  cashierId: string;
  cashierName?: string;
  customerId?: string | null;
  customerName?: string | null;
  cartItems: POSCartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentSplits: POSPaymentSplit[];
  notes?: string | null;
  warehouseId?: string;
}

export interface POSCheckoutResult {
  success: boolean;
  order: POSOrderDTO;
  payments: POSPaymentDTO[];
  inventoryLogs: InventoryLogDTO[];
  customerDueBalance?: number;
  message: string;
}

/**
 * Enterprise Service for POS Checkout Transactions, Multi-Payment Split Handling, Stock Deduction, and Customer Due Tracking.
 */
export class CheckoutService {
  private static instance: CheckoutService | null = null;

  // In-memory stores: Map<merchantId, POSOrderDTO[]>
  private ordersStore: Map<string, POSOrderDTO[]> = new Map();
  private paymentsStore: Map<string, POSPaymentDTO[]> = new Map();
  private customerDueLedgerStore: Map<string, number> = new Map(); // customerId -> total due

  private constructor() {
    this.seedDemoOrders();
  }

  public static getInstance(): CheckoutService {
    if (!CheckoutService.instance) {
      CheckoutService.instance = new CheckoutService();
    }
    return CheckoutService.instance;
  }

  /**
   * Processes POS Checkout: validates stock, creates POSOrder & POSPayments atomically, deducts inventory stock, and logs audit events.
   */
  public async processPOSCheckout(
    payload: POSCheckoutPayload,
    stockMap?: Map<string, number>
  ): Promise<POSCheckoutResult> {
    const {
      merchantId,
      registerId,
      sessionId,
      cashierId,
      cashierName,
      customerId,
      cartItems,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentSplits,
      notes,
      warehouseId = 'wh-main',
    } = payload;

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cannot process POS checkout with an empty cart.');
    }

    if (!paymentSplits || paymentSplits.length === 0) {
      throw new Error('At least one payment method split must be provided.');
    }

    // Step 1: Stock Validation
    if (stockMap) {
      for (const item of cartItems) {
        const availableStock = stockMap.get(item.variantId) ?? 999;
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.productName} (${item.variantName})". Available: ${availableStock}, Requested: ${item.quantity}.`
          );
        }
      }
    }

    // Step 2: Calculate Payment Totals & Due Balance
    const totalPaid = paymentSplits.reduce((sum, p) => sum + p.amount, 0);
    const cleanGrandTotal = Math.round(grandTotal * 100) / 100;
    const cleanTotalPaid = Math.round(totalPaid * 100) / 100;
    const dueAmount = Math.max(0, Math.round((cleanGrandTotal - cleanTotalPaid) * 100) / 100);

    let paymentStatus: POSPaymentStatusType = 'PAID';
    if (dueAmount > 0 && cleanTotalPaid > 0) {
      paymentStatus = 'PARTIAL';
    } else if (dueAmount > 0 && cleanTotalPaid === 0) {
      paymentStatus = 'DUE';
    }

    // Step 3: Create Order Record
    const orderId = `pos-order-${Date.now()}`;
    const orderNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newOrder: POSOrderDTO = {
      id: orderId,
      merchantId,
      registerId,
      sessionId,
      cashierId,
      cashierName,
      customerId: customerId || null,
      orderNumber,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal: cleanGrandTotal,
      paidAmount: cleanTotalPaid,
      dueAmount,
      paymentStatus,
      fulfillmentStatus: 'COMPLETED',
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 4: Create Split POSPayment Records
    const createdPayments: POSPaymentDTO[] = [];
    paymentSplits.forEach((split, idx) => {
      const paymentRecord: POSPaymentDTO = {
        id: `pos-pay-${Date.now()}-${idx}`,
        posOrderId: orderId,
        paymentMethod: split.paymentMethod,
        amount: Math.round(split.amount * 100) / 100,
        transactionReference: split.transactionReference || null,
        createdAt: new Date().toISOString(),
      };
      createdPayments.push(paymentRecord);
    });

    // Step 5: Deduct Stock & Generate Inventory Logs ('SALE_POS')
    const inventoryLogs: InventoryLogDTO[] = [];
    for (const item of cartItems) {
      const currentStock = stockMap?.get(item.variantId) ?? 100;
      const quantityAfter = Math.max(0, currentStock - item.quantity);

      if (stockMap) {
        stockMap.set(item.variantId, quantityAfter);
      }

      inventoryLogs.push({
        id: `inv-log-${Date.now()}-${item.variantId.slice(-4)}`,
        merchantId,
        warehouseId,
        variantId: item.variantId,
        changeType: 'SALE_POS',
        quantityChanged: -item.quantity,
        quantityAfter,
        referenceId: orderNumber,
        createdAt: new Date().toISOString(),
      });
    }

    // Step 6: Update Customer Due Ledger if due balance exists
    let updatedCustomerDue: number | undefined;
    if (dueAmount > 0 && customerId) {
      const existingDue = this.customerDueLedgerStore.get(customerId) || 0;
      updatedCustomerDue = Math.round((existingDue + dueAmount) * 100) / 100;
      this.customerDueLedgerStore.set(customerId, updatedCustomerDue);
    }

    // Save to in-memory store
    const existingOrders = this.ordersStore.get(merchantId) || [];
    existingOrders.unshift({ ...newOrder, payments: createdPayments });
    this.ordersStore.set(merchantId, existingOrders);

    const existingPayments = this.paymentsStore.get(merchantId) || [];
    this.paymentsStore.set(merchantId, [...createdPayments, ...existingPayments]);

    return {
      success: true,
      order: newOrder,
      payments: createdPayments,
      inventoryLogs,
      customerDueBalance: updatedCustomerDue,
      message: `POS Order ${orderNumber} processed successfully. Total: ৳${cleanGrandTotal}`,
    };
  }

  /**
   * Retrieves orders for a specific register session.
   */
  public async getOrdersBySession(merchantId: string, sessionId: string): Promise<POSOrderDTO[]> {
    const orders = this.ordersStore.get(merchantId) || [];
    return orders.filter((o) => o.sessionId === sessionId);
  }

  /**
   * Retrieves an order by ID or orderNumber.
   */
  public async getOrderById(merchantId: string, orderIdOrNumber: string): Promise<POSOrderDTO | null> {
    const orders = this.ordersStore.get(merchantId) || [];
    return (
      orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber) || null
    );
  }

  /**
   * Gets customer due balance.
   */
  public async getCustomerDueBalance(customerId: string): Promise<number> {
    return this.customerDueLedgerStore.get(customerId) || 0;
  }

  private seedDemoOrders(): void {
    const demoId = 'merch-techstore';
    const demoSessionId = 'session-demo-01';

    const seedOrders: POSOrderDTO[] = [
      {
        id: 'pos-order-demo-1',
        merchantId: demoId,
        registerId: 'reg-counter-01',
        sessionId: demoSessionId,
        cashierId: 'cashier-demo-01',
        cashierName: 'Rahim Ahmed',
        customerId: 'cust-101',
        orderNumber: 'POS-20260801-1001',
        subtotal: 3000,
        discountAmount: 200,
        taxAmount: 140,
        grandTotal: 2940,
        paidAmount: 2940,
        dueAmount: 0,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'COMPLETED',
        notes: 'Walk-in customer purchase',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        payments: [
          {
            id: 'pay-1',
            posOrderId: 'pos-order-demo-1',
            paymentMethod: 'CASH',
            amount: 1440,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'pay-2',
            posOrderId: 'pos-order-demo-1',
            paymentMethod: 'BKASH',
            amount: 1500,
            transactionReference: 'TRX-BKASH-88192',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
    ];

    this.ordersStore.set(demoId, seedOrders);
  }
}

export const checkoutService = CheckoutService.getInstance();
