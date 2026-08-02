import { ProductDTO, ProductVariantDTO } from '../../../types/inventory.types';
import { POSCheckoutPayload } from '../services/checkout.service';

export interface POSCustomerCacheItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  dueBalance: number;
}

export interface OfflineOrderEntry {
  offlineOrderId: string;
  merchantId: string;
  payload: POSCheckoutPayload;
  queuedAt: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
  serverOrderId?: string;
}

/**
 * In-Browser Storage & Local Database Engine for Offline POS Counter System.
 * Uses IndexedDB / LocalStorage with SSR safety fallbacks to store product catalog, customer records, and queued sales.
 */
export class POSOfflineDB {
  private static instance: POSOfflineDB | null = null;

  // In-memory fallback for SSR or environments without IndexedDB
  private memoryCatalogStore: Map<string, ProductDTO[]> = new Map();
  private memoryCustomerStore: Map<string, POSCustomerCacheItem[]> = new Map();
  private memoryOfflineQueue: OfflineOrderEntry[] = [];

  private constructor() {
    this.seedDemoCache();
  }

  public static getInstance(): POSOfflineDB {
    if (!POSOfflineDB.instance) {
      POSOfflineDB.instance = new POSOfflineDB();
    }
    return POSOfflineDB.instance;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --- CATALOG LOCAL CACHE ---

  /**
   * Caches full merchant product catalog locally for fast offline searching.
   */
  public async cacheCatalog(merchantId: string, products: ProductDTO[]): Promise<void> {
    this.memoryCatalogStore.set(merchantId, products);
    if (this.isBrowser()) {
      try {
        localStorage.setItem(`pos_catalog_${merchantId}`, JSON.stringify(products));
      } catch (err) {
        console.warn('POSOfflineDB: Failed to write catalog to LocalStorage', err);
      }
    }
  }

  /**
   * Retrieves cached catalog.
   */
  public async getCachedCatalog(merchantId: string): Promise<ProductDTO[]> {
    if (this.memoryCatalogStore.has(merchantId)) {
      return this.memoryCatalogStore.get(merchantId)!;
    }
    if (this.isBrowser()) {
      try {
        const raw = localStorage.getItem(`pos_catalog_${merchantId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryCatalogStore.set(merchantId, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('POSOfflineDB: Failed to read catalog from LocalStorage', err);
      }
    }
    return [];
  }

  /**
   * Fast offline barcode search over cached catalog.
   */
  public async searchCachedProductByBarcode(
    merchantId: string,
    query: string
  ): Promise<{ product?: ProductDTO; variant?: ProductVariantDTO } | null> {
    const catalog = await this.getCachedCatalog(merchantId);
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return null;

    for (const product of catalog) {
      if (product.variants) {
        for (const variant of product.variants) {
          if (
            variant.sku.toLowerCase() === cleanQuery ||
            (variant.barcode && variant.barcode.toLowerCase() === cleanQuery)
          ) {
            return { product, variant };
          }
        }
      }
    }

    return null;
  }

  // --- CUSTOMER LOCAL CACHE ---

  /**
   * Caches customer database for offline POS checkout.
   */
  public async cacheCustomers(
    merchantId: string,
    customers: POSCustomerCacheItem[]
  ): Promise<void> {
    this.memoryCustomerStore.set(merchantId, customers);
    if (this.isBrowser()) {
      try {
        localStorage.setItem(`pos_customers_${merchantId}`, JSON.stringify(customers));
      } catch (err) {
        console.warn('POSOfflineDB: Failed to write customers to LocalStorage', err);
      }
    }
  }

  /**
   * Retrieves cached customers list.
   */
  public async getCachedCustomers(merchantId: string): Promise<POSCustomerCacheItem[]> {
    if (this.memoryCustomerStore.has(merchantId)) {
      return this.memoryCustomerStore.get(merchantId)!;
    }
    if (this.isBrowser()) {
      try {
        const raw = localStorage.getItem(`pos_customers_${merchantId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryCustomerStore.set(merchantId, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('POSOfflineDB: Failed to read customers from LocalStorage', err);
      }
    }
    return [];
  }

  // --- OFFLINE ORDERS TRANSACTION QUEUE ---

  /**
   * Queues an offline sale transaction into local IndexedDB queue when network is disconnected.
   */
  public async enqueueOfflineOrder(payload: POSCheckoutPayload): Promise<OfflineOrderEntry> {
    const offlineOrderId = `off-order-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const entry: OfflineOrderEntry = {
      offlineOrderId,
      merchantId: payload.merchantId,
      payload,
      queuedAt: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
    };

    this.memoryOfflineQueue.push(entry);
    this.persistQueueToStorage();

    return entry;
  }

  /**
   * Gets all pending offline orders waiting to sync to server.
   */
  public async getPendingOfflineOrders(merchantId?: string): Promise<OfflineOrderEntry[]> {
    this.loadQueueFromStorage();
    return this.memoryOfflineQueue.filter((o) => {
      const matchMerchant = merchantId ? o.merchantId === merchantId : true;
      return matchMerchant && (o.syncStatus === 'PENDING' || o.syncStatus === 'FAILED');
    });
  }

  /**
   * Updates offline order sync status.
   */
  public async updateOfflineOrderStatus(
    offlineOrderId: string,
    syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED',
    serverOrderId?: string,
    errorMessage?: string
  ): Promise<void> {
    this.loadQueueFromStorage();
    const entry = this.memoryOfflineQueue.find((o) => o.offlineOrderId === offlineOrderId);
    if (entry) {
      entry.syncStatus = syncStatus;
      if (serverOrderId) entry.serverOrderId = serverOrderId;
      if (errorMessage) entry.errorMessage = errorMessage;
      if (syncStatus === 'FAILED') entry.retryCount += 1;
      this.persistQueueToStorage();
    }
  }

  /**
   * Removes synced order from local queue.
   */
  public async removeOfflineOrder(offlineOrderId: string): Promise<void> {
    this.loadQueueFromStorage();
    this.memoryOfflineQueue = this.memoryOfflineQueue.filter(
      (o) => o.offlineOrderId !== offlineOrderId
    );
    this.persistQueueToStorage();
  }

  /**
   * Purges all completed synced orders from offline queue.
   */
  public async clearSyncedOrders(): Promise<void> {
    this.loadQueueFromStorage();
    this.memoryOfflineQueue = this.memoryOfflineQueue.filter(
      (o) => o.syncStatus !== 'SYNCED'
    );
    this.persistQueueToStorage();
  }

  private persistQueueToStorage(): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem('pos_offline_queue', JSON.stringify(this.memoryOfflineQueue));
      } catch (err) {
        console.warn('POSOfflineDB: Failed to persist offline queue', err);
      }
    }
  }

  private loadQueueFromStorage(): void {
    if (this.isBrowser() && this.memoryOfflineQueue.length === 0) {
      try {
        const raw = localStorage.getItem('pos_offline_queue');
        if (raw) {
          this.memoryOfflineQueue = JSON.parse(raw);
        }
      } catch (err) {
        console.warn('POSOfflineDB: Failed to load offline queue', err);
      }
    }
  }

  private seedDemoCache(): void {
    const demoId = 'merch-techstore';

    this.memoryCustomerStore.set(demoId, [
      { id: 'cust-101', name: 'Karim Ahmed', phone: '+8801700112233', email: 'karim@gmail.com', dueBalance: 0 },
      { id: 'cust-102', name: 'Nusrat Jahan', phone: '+8801811223344', email: 'nusrat@yahoo.com', dueBalance: 500 },
    ]);
  }
}

export const posOfflineDB = POSOfflineDB.getInstance();
