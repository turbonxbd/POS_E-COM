import {
  CourierConsignmentPayload,
  CourierProviderType,
  OrderCourierMappingDTO,
} from '../../../types/order-management.types';
import { courierService } from '../courier/courier.service';
import { orderLifecycleService } from './order-lifecycle.service';

export interface BulkDispatchResult {
  totalDispatched: number;
  successfulOrderIds: string[];
  failedOrders: { orderId: string; error: string }[];
  mappings: OrderCourierMappingDTO[];
  message: string;
}

/**
 * Enterprise Service for Bulk Parcel Courier Dispatching & Mapping Records.
 */
export class CourierDispatchService {
  private static instance: CourierDispatchService | null = null;
  // In-memory store: Map<orderId, OrderCourierMappingDTO>
  private courierMappingsStore: Map<string, OrderCourierMappingDTO> = new Map();

  private constructor() {}

  public static getInstance(): CourierDispatchService {
    if (!CourierDispatchService.instance) {
      CourierDispatchService.instance = new CourierDispatchService();
    }
    return CourierDispatchService.instance;
  }

  /**
   * Dispatches single or bulk orders to selected Bangladesh courier system.
   */
  public async dispatchToCourier(
    orderIds: string[],
    provider: CourierProviderType,
    merchantId: string
  ): Promise<BulkDispatchResult> {
    if (!orderIds || orderIds.length === 0) {
      throw new Error('No order IDs provided for courier dispatch.');
    }

    const successfulOrderIds: string[] = [];
    const failedOrders: { orderId: string; error: string }[] = [];
    const mappings: OrderCourierMappingDTO[] = [];

    for (const id of orderIds) {
      try {
        const order = await orderLifecycleService.getOrderById(merchantId, id);
        if (!order) {
          failedOrders.push({ orderId: id, error: `Order "${id}" not found.` });
          continue;
        }

        if (order.currentStatus === 'DELIVERED' || order.currentStatus === 'CANCELLED') {
          failedOrders.push({
            orderId: id,
            error: `Cannot dispatch order #${order.orderNumber} because it is in status "${order.currentStatus}".`,
          });
          continue;
        }

        // Construct Consignment Payload
        const payload: CourierConsignmentPayload = {
          orderId: order.orderNumber,
          merchantId,
          courierProvider: provider,
          recipientName: order.recipientName,
          recipientPhone: order.recipientPhone,
          recipientAddress: order.shippingAddress,
          recipientDistrict: order.district || 'Dhaka',
          codAmount: order.dueAmount,
          deliveryFee: order.shippingFee,
          specialInstruction: `Order #${order.orderNumber}`,
        };

        // Dispatch via Courier API
        const dispatchRes = await courierService.dispatchParcel(provider, payload);

        // Record Courier Mapping
        const mapping: OrderCourierMappingDTO = {
          id: `map-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          orderId: order.id,
          merchantId,
          courierProvider: provider,
          consignmentId: dispatchRes.consignmentId,
          trackingCode: dispatchRes.trackingCode,
          deliveryFee: dispatchRes.deliveryFee,
          codAmount: order.dueAmount,
          courierStatus: dispatchRes.courierStatus,
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        this.courierMappingsStore.set(order.id, mapping);
        mappings.push(mapping);

        // Auto-update order status to 'SHIPPED' or 'PACKED'
        let targetStatus: 'PACKED' | 'SHIPPED' = 'SHIPPED';
        if (order.currentStatus === 'PENDING') {
          // Transition through PROCESSING -> PACKED -> SHIPPED
          await orderLifecycleService.updateOrderStatus(
            merchantId,
            order.id,
            'PROCESSING',
            'SYSTEM',
            'Processing before courier dispatch'
          );
        }

        if (order.currentStatus === 'PROCESSING') {
          await orderLifecycleService.updateOrderStatus(
            merchantId,
            order.id,
            'PACKED',
            'SYSTEM',
            'Packed in warehouse'
          );
        }

        await orderLifecycleService.updateOrderStatus(
          merchantId,
          order.id,
          targetStatus,
          'SYSTEM',
          `Dispatched via ${provider} (Tracking Code: ${dispatchRes.trackingCode})`
        );

        successfulOrderIds.push(order.id);
      } catch (err: any) {
        failedOrders.push({ orderId: id, error: err.message || 'Parcel dispatch failed.' });
      }
    }

    return {
      totalDispatched: successfulOrderIds.length,
      successfulOrderIds,
      failedOrders,
      mappings,
      message: `Successfully dispatched ${successfulOrderIds.length} orders via ${provider}.`,
    };
  }

  /**
   * Fetches courier mapping record for an order.
   */
  public async getOrderCourierMapping(orderId: string): Promise<OrderCourierMappingDTO | null> {
    return this.courierMappingsStore.get(orderId) || null;
  }
}

export const courierDispatchService = CourierDispatchService.getInstance();
