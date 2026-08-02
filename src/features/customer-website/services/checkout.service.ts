import {
  CheckoutFormPayload,
  OrderTrackingLogDTO,
  OrderTrackingResponse,
  OrderTrackingStatusType,
} from '../../../types/customer-website.types';
import { InventoryLogDTO } from '../../../types/inventory.types';
import { storefrontCartService } from './cart.service';
import { shippingService } from './shipping.service';

export interface StorefrontOrderRecord {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  merchantId: string;
  customerId?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  division: string;
  district: string;
  addressDetails: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  currentStatus: OrderTrackingStatusType;
  estimatedDeliveryDate: string;
  createdAt: string;
}

export interface StorefrontCheckoutResult {
  success: boolean;
  orderNumber: string;
  trackingNumber: string;
  grandTotal: number;
  shippingFee: number;
  paymentMethod: string;
  paymentGatewayUrl?: string | null;
  estimatedDeliveryDate: string;
  message: string;
}

/**
 * Enterprise Service for Customer Storefront Order Placement, COD / Payment Gateway Integration, Stock Deduction, and Order Tracking.
 */
export class StorefrontCheckoutService {
  private static instance: StorefrontCheckoutService | null = null;

  // In-memory stores
  private ordersStore: Map<string, StorefrontOrderRecord[]> = new Map();
  private trackingLogsStore: Map<string, OrderTrackingLogDTO[]> = new Map();

  private constructor() {
    this.seedDemoStorefrontOrders();
  }

  public static getInstance(): StorefrontCheckoutService {
    if (!StorefrontCheckoutService.instance) {
      StorefrontCheckoutService.instance = new StorefrontCheckoutService();
    }
    return StorefrontCheckoutService.instance;
  }

  /**
   * Processes Customer Storefront Order Placement for COD, bKash, Nagad, or Card (SSLCommerz).
   */
  public async processStorefrontCheckout(
    payload: CheckoutFormPayload,
    stockMap?: Map<string, number>
  ): Promise<StorefrontCheckoutResult> {
    const {
      merchantId,
      customerId,
      recipientName,
      recipientPhone,
      recipientEmail,
      division,
      district,
      addressDetails,
      paymentMethod,
      cartItems,
      couponCode,
    } = payload;

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cannot process order with an empty shopping cart.');
    }

    // 1. Stock Validation
    if (stockMap) {
      for (const item of cartItems) {
        const availableStock = stockMap.get(item.variantId) ?? 100;
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product "${item.productName} (${item.variantName})". Available: ${availableStock}, Requested: ${item.quantity}.`
          );
        }
      }
    }

    // 2. Shipping Charge Calculation
    const shippingRes = shippingService.calculateShippingFee(division, district, 0);

    // 3. Cart & Coupon Recalculation
    const cartRes = storefrontCartService.calculateCartTotals(
      cartItems,
      couponCode,
      shippingRes.shippingFee
    );

    // Re-verify shipping with actual subtotal for free shipping threshold
    const finalShippingRes = shippingService.calculateShippingFee(
      division,
      district,
      cartRes.subtotal
    );
    const cleanGrandTotal =
      Math.round((cartRes.subtotal - cartRes.discountAmount + finalShippingRes.shippingFee) * 100) /
      100;

    // 4. Generate Order & Tracking Numbers
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const trackingNumber = `TRK-BD-${Math.floor(100000 + Math.random() * 900000)}`;

    const deliveryDays = finalShippingRes.shippingFee === 70 ? 2 : 4; // Inside Dhaka 2 days, Outside 4 days
    const estimatedDeliveryDate = new Date(
      Date.now() + deliveryDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 5. Payment Gateway Session Setup
    let paymentGatewayUrl: string | null = null;
    if (paymentMethod === 'CARD') {
      paymentGatewayUrl = `https://sandbox.sslcommerz.com/gwprocess/v4/pay/${orderNumber}`;
    } else if (paymentMethod === 'BKASH') {
      paymentGatewayUrl = `https://checkout.bkash.com/pay/${orderNumber}`;
    }

    // 6. Create Order Record
    const newOrder: StorefrontOrderRecord = {
      id: orderId,
      orderNumber,
      trackingNumber,
      merchantId,
      customerId: customerId || null,
      recipientName,
      recipientPhone,
      recipientEmail: recipientEmail || null,
      division,
      district,
      addressDetails,
      paymentMethod,
      subtotal: cartRes.subtotal,
      discountAmount: cartRes.discountAmount,
      shippingFee: finalShippingRes.shippingFee,
      grandTotal: cleanGrandTotal,
      currentStatus: 'PENDING',
      estimatedDeliveryDate,
      createdAt: new Date().toISOString(),
    };

    // 7. Initial Order Tracking Log Entry
    const initialLog: OrderTrackingLogDTO = {
      id: `trk-log-${Date.now()}`,
      orderId,
      status: 'PENDING',
      statusNote: 'Order placed successfully. Awaiting merchant confirmation.',
      updatedBy: 'Customer Portal',
      createdAt: new Date().toISOString(),
    };

    // 8. Deduct Stock & Generate Inventory Logs ('SALE_ONLINE')
    const inventoryLogs: InventoryLogDTO[] = [];
    for (const item of cartItems) {
      const currentStock = stockMap?.get(item.variantId) ?? 100;
      const quantityAfter = Math.max(0, currentStock - item.quantity);

      if (stockMap) {
        stockMap.set(item.variantId, quantityAfter);
      }

      inventoryLogs.push({
        id: `inv-log-online-${Date.now()}-${item.variantId.slice(-4)}`,
        merchantId,
        warehouseId: 'wh-main',
        variantId: item.variantId,
        changeType: 'SALE_ONLINE',
        quantityChanged: -item.quantity,
        quantityAfter,
        referenceId: orderNumber,
        createdAt: new Date().toISOString(),
      });
    }

    // Save to store
    const merchantOrders = this.ordersStore.get(merchantId) || [];
    merchantOrders.unshift(newOrder);
    this.ordersStore.set(merchantId, merchantOrders);

    this.trackingLogsStore.set(orderId, [initialLog]);

    return {
      success: true,
      orderNumber,
      trackingNumber,
      grandTotal: cleanGrandTotal,
      shippingFee: finalShippingRes.shippingFee,
      paymentMethod,
      paymentGatewayUrl,
      estimatedDeliveryDate,
      message: `Order #${orderNumber} placed successfully! Tracking Number: ${trackingNumber}`,
    };
  }

  /**
   * Fetches order tracking timeline and current status by Order Number or ID.
   */
  public async getOrderTracking(
    merchantId: string,
    orderNumberOrId: string
  ): Promise<OrderTrackingResponse | null> {
    const orders = this.ordersStore.get(merchantId) || [];
    const cleanSearch = orderNumberOrId.trim().toUpperCase();

    const order = orders.find(
      (o) => o.id === orderNumberOrId || o.orderNumber.toUpperCase() === cleanSearch
    );
    if (!order) return null;

    const logs = this.trackingLogsStore.get(order.id) || [];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.currentStatus,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      recipientAddress: `${order.addressDetails}, ${order.district}, ${order.division}`,
      trackingLogs: logs,
    };
  }

  private seedDemoStorefrontOrders(): void {
    const demoId = 'merch-techstore';
    const demoOrderId = 'ord-demo-1001';

    const seedOrder: StorefrontOrderRecord = {
      id: demoOrderId,
      orderNumber: 'ORD-20260801-9901',
      trackingNumber: 'TRK-BD-880192',
      merchantId: demoId,
      customerId: 'cust-101',
      recipientName: 'Karim Ahmed',
      recipientPhone: '+8801700112233',
      recipientEmail: 'karim@gmail.com',
      division: 'Dhaka',
      district: 'Dhaka',
      addressDetails: 'House 42, Road 11, Banani',
      paymentMethod: 'COD',
      subtotal: 2900,
      discountAmount: 100,
      shippingFee: 70,
      grandTotal: 2870,
      currentStatus: 'PROCESSING',
      estimatedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.ordersStore.set(demoId, [seedOrder]);
    this.trackingLogsStore.set(demoOrderId, [
      {
        id: 'trk-log-1',
        orderId: demoOrderId,
        status: 'PENDING',
        statusNote: 'Order placed by customer.',
        updatedBy: 'Customer Portal',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'trk-log-2',
        orderId: demoOrderId,
        status: 'PROCESSING',
        statusNote: 'Merchant confirmed order and packing item in Dhaka Central Warehouse.',
        updatedBy: 'Warehouse Manager',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ]);
  }
}

export const storefrontCheckoutService = StorefrontCheckoutService.getInstance();
