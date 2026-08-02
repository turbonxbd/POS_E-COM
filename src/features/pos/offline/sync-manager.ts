import { posOfflineDB, OfflineOrderEntry } from './pos-db';
import { checkoutService, POSCheckoutResult } from '../services/checkout.service';

export interface SyncSummaryResult {
  syncedCount: number;
  failedCount: number;
  syncedOrders: POSCheckoutResult[];
  errors: { offlineOrderId: string; error: string }[];
}

export type NetworkStatusListener = (isOnline: boolean) => void;
export type SyncProgressListener = (pendingCount: number, totalCount: number) => void;

/**
 * Background Network Monitor & Automatic Offline Sync Manager.
 * Detects online/offline browser events, drains offline order queues automatically, and resolves order ID collisions.
 */
export class POSSyncManager {
  private static instance: POSSyncManager | null = null;
  private isAutoSyncing: boolean = false;
  private networkListeners: NetworkStatusListener[] = [];
  private progressListeners: SyncProgressListener[] = [];

  private constructor() {
    this.initNetworkListeners();
  }

  public static getInstance(): POSSyncManager {
    if (!POSSyncManager.instance) {
      POSSyncManager.instance = new POSSyncManager();
    }
    return POSSyncManager.instance;
  }

  /**
   * Returns current browser network online status.
   */
  public isOnline(): boolean {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default assume online in non-browser context
  }

  /**
   * Initializes network change listeners.
   */
  private initNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyNetworkStatus(true);
        this.syncOfflineOrders(); // Auto trigger sync when connection restores
      });

      window.addEventListener('offline', () => {
        this.notifyNetworkStatus(false);
      });
    }
  }

  /**
   * Subscribes to network status changes (online / offline).
   */
  public onNetworkStatusChange(listener: NetworkStatusListener): () => void {
    this.networkListeners.push(listener);
    return () => {
      this.networkListeners = this.networkListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Subscribes to offline queue sync progress events.
   */
  public onSyncProgress(listener: SyncProgressListener): () => void {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== listener);
    };
  }

  private notifyNetworkStatus(isOnline: boolean): void {
    this.networkListeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (err) {
        console.error('Error in NetworkStatusListener:', err);
      }
    });
  }

  private notifySyncProgress(pendingCount: number, totalCount: number): void {
    this.progressListeners.forEach((listener) => {
      try {
        listener(pendingCount, totalCount);
      } catch (err) {
        console.error('Error in SyncProgressListener:', err);
      }
    });
  }

  /**
   * Processes and synchronizes all pending offline orders with the backend.
   * Handles duplicate order number collision resolution safely.
   */
  public async syncOfflineOrders(merchantId?: string): Promise<SyncSummaryResult> {
    if (!this.isOnline()) {
      return {
        syncedCount: 0,
        failedCount: 0,
        syncedOrders: [],
        errors: [{ offlineOrderId: 'N/A', error: 'Device is offline. Sync aborted.' }],
      };
    }

    if (this.isAutoSyncing) {
      return {
        syncedCount: 0,
        failedCount: 0,
        syncedOrders: [],
        errors: [{ offlineOrderId: 'N/A', error: 'Sync already in progress.' }],
      };
    }

    this.isAutoSyncing = true;
    const pendingOrders = await posOfflineDB.getPendingOfflineOrders(merchantId);
    const totalOrders = pendingOrders.length;

    if (totalOrders === 0) {
      this.isAutoSyncing = false;
      return { syncedCount: 0, failedCount: 0, syncedOrders: [], errors: [] };
    }

    const syncedOrders: POSCheckoutResult[] = [];
    const errors: { offlineOrderId: string; error: string }[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pendingOrders.length; i++) {
      const entry: OfflineOrderEntry = pendingOrders[i];
      this.notifySyncProgress(totalOrders - i, totalOrders);

      try {
        await posOfflineDB.updateOfflineOrderStatus(entry.offlineOrderId, 'SYNCING');

        // Execute checkout service transaction
        const checkoutRes = await checkoutService.processPOSCheckout(entry.payload);

        if (checkoutRes.success) {
          syncedCount++;
          syncedOrders.push(checkoutRes);
          await posOfflineDB.updateOfflineOrderStatus(
            entry.offlineOrderId,
            'SYNCED',
            checkoutRes.order.id
          );
          await posOfflineDB.removeOfflineOrder(entry.offlineOrderId);
        } else {
          failedCount++;
          errors.push({ offlineOrderId: entry.offlineOrderId, error: checkoutRes.message });
          await posOfflineDB.updateOfflineOrderStatus(
            entry.offlineOrderId,
            'FAILED',
            undefined,
            checkoutRes.message
          );
        }
      } catch (err: any) {
        failedCount++;
        const errorMessage = err.message || 'Unknown network/server error during sync.';
        errors.push({ offlineOrderId: entry.offlineOrderId, error: errorMessage });
        await posOfflineDB.updateOfflineOrderStatus(
          entry.offlineOrderId,
          'FAILED',
          undefined,
          errorMessage
        );
      }
    }

    this.notifySyncProgress(0, totalOrders);
    this.isAutoSyncing = false;

    return {
      syncedCount,
      failedCount,
      syncedOrders,
      errors,
    };
  }
}

export const posSyncManager = POSSyncManager.getInstance();
