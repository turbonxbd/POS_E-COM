import { courierService } from '../courier/courier.service';
import { orderLifecycleService } from '../services/order-lifecycle.service';

export interface CourierSyncResult {
  syncedCount: number;
  statusChanges: { orderId: string; orderNumber: string; oldStatus: string; newStatus: string }[];
  syncedAt: string;
}

/**
 * Scheduled Cron Sync Job for Querying Live Courier Statuses and Updating Platform Orders.
 */
export class CourierSyncCron {
  private static instance: CourierSyncCron | null = null;

  private constructor() {}

  public static getInstance(): CourierSyncCron {
    if (!CourierSyncCron.instance) {
      CourierSyncCron.instance = new CourierSyncCron();
    }
    return CourierSyncCron.instance;
  }

  /**
   * Syncs active shipments in 'SHIPPED' status with live courier APIs (Steadfast / Pathao / etc.).
   */
  public async syncActiveShipments(merchantId: string = 'merch-techstore'): Promise<CourierSyncResult> {
    const { orders } = await orderLifecycleService.getOrders(merchantId, { status: 'SHIPPED' });

    let syncedCount = 0;
    const statusChanges: { orderId: string; orderNumber: string; oldStatus: string; newStatus: string }[] = [];

    for (const order of orders) {
      const mapping = order.courierMapping;
      if (!mapping || !mapping.trackingCode) continue;

      try {
        const syncRes = await courierService.fetchTrackingStatus(mapping.courierProvider, mapping.trackingCode);
        syncedCount++;

        if (syncRes.mappedOrderStatus !== order.currentStatus && (syncRes.mappedOrderStatus === 'DELIVERED' || syncRes.mappedOrderStatus === 'RETURNED')) {
          await orderLifecycleService.updateOrderStatus(
            merchantId,
            order.id,
            syncRes.mappedOrderStatus,
            'CRON_SYNC',
            `Automated courier sync: Delivery status updated to ${syncRes.mappedOrderStatus}`
          );

          statusChanges.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            oldStatus: order.currentStatus,
            newStatus: syncRes.mappedOrderStatus,
          });
        }
      } catch (err) {
        console.error(`[CourierSyncCron] Error syncing order #${order.orderNumber}:`, err);
      }
    }

    return {
      syncedCount,
      statusChanges,
      syncedAt: new Date().toISOString(),
    };
  }
}

export const courierSyncCron = CourierSyncCron.getInstance();
