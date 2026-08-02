import {
  CourierConsignmentPayload,
  CourierProviderType,
  CourierStatusSyncResponse,
} from '../../../types/order-management.types';
import { steadfastCourierProvider } from './steadfast.provider';
import { pathaoCourierProvider } from './pathao.provider';

export interface DispatchResponse {
  consignmentId: string;
  trackingCode: string;
  courierStatus: string;
  deliveryFee: number;
}

/**
 * Unified Courier Abstraction Gateway for Bangladesh Logistics API Systems.
 */
export class CourierService {
  private static instance: CourierService | null = null;

  private constructor() {}

  public static getInstance(): CourierService {
    if (!CourierService.instance) {
      CourierService.instance = new CourierService();
    }
    return CourierService.instance;
  }

  /**
   * Dispatches parcel consignment to selected Bangladesh courier system.
   */
  public async dispatchParcel(
    provider: CourierProviderType,
    payload: CourierConsignmentPayload
  ): Promise<DispatchResponse> {
    switch (provider) {
      case 'STEADFAST':
        return await steadfastCourierProvider.createOrder(payload);

      case 'PATHAO':
        return await pathaoCourierProvider.createOrder(payload);

      case 'PAPERFLY':
        return {
          consignmentId: `PFL-${Math.floor(100000 + Math.random() * 900000)}`,
          trackingCode: `TRK-PFL-${Math.floor(100000 + Math.random() * 900000)}`,
          courierStatus: 'Pending Pickup',
          deliveryFee: payload.deliveryFee || 80,
        };

      case 'REDX':
        return {
          consignmentId: `RDX-${Math.floor(100000 + Math.random() * 900000)}`,
          trackingCode: `TRK-RDX-${Math.floor(100000 + Math.random() * 900000)}`,
          courierStatus: 'Ready for Dispatch',
          deliveryFee: payload.deliveryFee || 75,
        };

      case 'MANUAL':
      default:
        return {
          consignmentId: `MAN-${Math.floor(100000 + Math.random() * 900000)}`,
          trackingCode: `TRK-MAN-${Math.floor(100000 + Math.random() * 900000)}`,
          courierStatus: 'Self Delivery',
          deliveryFee: payload.deliveryFee || 50,
        };
    }
  }

  /**
   * Fetches normalized tracking status from the target courier partner.
   */
  public async fetchTrackingStatus(
    provider: CourierProviderType,
    trackingCode: string
  ): Promise<CourierStatusSyncResponse> {
    if (provider === 'STEADFAST') {
      const res = await steadfastCourierProvider.getDeliveryStatus(trackingCode);
      return {
        orderId: '',
        consignmentId: trackingCode,
        trackingCode: res.trackingCode,
        courierStatus: res.courierStatus,
        mappedOrderStatus: res.mappedStatus,
        deliveryFee: 70,
        codAmount: 0,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    if (provider === 'PATHAO') {
      const res = await pathaoCourierProvider.getTrackInfo(trackingCode);
      return {
        orderId: '',
        consignmentId: trackingCode,
        trackingCode: res.trackingCode,
        courierStatus: res.courierStatus,
        mappedOrderStatus: res.mappedStatus,
        deliveryFee: 75,
        codAmount: 0,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    return {
      orderId: '',
      consignmentId: trackingCode,
      trackingCode,
      courierStatus: 'In Transit',
      mappedOrderStatus: 'SHIPPED',
      deliveryFee: 70,
      codAmount: 0,
      lastSyncedAt: new Date().toISOString(),
    };
  }
}

export const courierService = CourierService.getInstance();
