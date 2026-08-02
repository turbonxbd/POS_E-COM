/**
 * High-Performance In-Memory & HTTP Edge CDN Caching Layer for Storefront Catalog, POS Products, and Tenant Configs.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache {
  private static instance: InMemoryCache | null = null;
  private store: Map<string, CacheEntry<any>> = new Map();

  private constructor() {
    // Background garbage collection every 5 minutes
    if (typeof window === 'undefined') {
      setInterval(() => this.purgeExpired(), 5 * 60 * 1000);
    }
  }

  public static getInstance(): InMemoryCache {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache();
    }
    return InMemoryCache.instance;
  }

  /**
   * Retrieves item from cache if not expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stores value in cache with specified TTL in seconds.
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Removes specific item from cache.
   */
  public delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears entire cache.
   */
  public clear(): void {
    this.store.clear();
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const inMemoryCache = InMemoryCache.getInstance();

/**
 * Returns HTTP Cache-Control headers with Stale-While-Revalidate (SWR) directives for Edge CDN nodes.
 */
export function getCacheHeaders(ttlSeconds: number = 60, swrSeconds: number = 300): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
  };
}

/**
 * Higher-order caching wrapper function.
 */
export async function withCache<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = inMemoryCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetchFn();
  inMemoryCache.set(cacheKey, fresh, ttlSeconds);
  return fresh;
}
