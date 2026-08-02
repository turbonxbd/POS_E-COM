export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Enterprise In-Memory Dashboard Query Caching Strategy (60s TTL).
 */
export class DashboardCache {
  private static instance: DashboardCache | null = null;
  private cacheMap: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  public static getInstance(): DashboardCache {
    if (!DashboardCache.instance) {
      DashboardCache.instance = new DashboardCache();
    }
    return DashboardCache.instance;
  }

  /**
   * Retrieves cached data if valid and not expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.cacheMap.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cacheMap.delete(key);
      return null; // Expired cache entry
    }

    return entry.data as T;
  }

  /**
   * Caches response payload for specified TTL seconds (Default: 60 seconds).
   */
  public set<T>(key: string, data: T, ttlSeconds = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cacheMap.set(key, { data, expiresAt });
  }

  /**
   * Clears cache for a specific merchant store.
   */
  public invalidateMerchantCache(merchantId: string): void {
    for (const key of this.cacheMap.keys()) {
      if (key.includes(merchantId)) {
        this.cacheMap.delete(key);
      }
    }
  }
}

export const dashboardCache = DashboardCache.getInstance();
