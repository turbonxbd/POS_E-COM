export interface RateLimitStatus {
  isBlocked: boolean;
  remainingAttempts: number;
  resetTimeMs?: number;
  error?: string;
}

export type RateLimitEndpointType = 'LOGIN' | 'OTP' | 'CHECKOUT' | 'POS_SYNC' | 'GENERAL';

export interface EndpointLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export const ENDPOINT_LIMIT_CONFIGS: Record<RateLimitEndpointType, EndpointLimitConfig> = {
  LOGIN: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 attempts per min
  OTP: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 attempts per min
  CHECKOUT: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 attempts per min
  POS_SYNC: { maxAttempts: 60, windowMs: 60 * 1000 }, // 60 requests per min
  GENERAL: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per min
};

/**
 * Enterprise Memory & Redis-ready Rate Limiter for Authentication, OTP, Checkout & POS Sync.
 */
export class RateLimiter {
  private static instance: RateLimiter | null = null;
  private attemptsMap: Map<string, { count: number; firstAttemptAt: number }> = new Map();

  private constructor() {
    // Purge stale rate limit keys every 5 minutes
    if (typeof window === 'undefined') {
      setInterval(() => this.purgeStaleEntries(), 5 * 60 * 1000);
    }
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Checks rate limit status for endpoint type and client key (IP or Account ID).
   */
  public checkEndpointRateLimit(
    clientKey: string,
    endpointType: RateLimitEndpointType = 'GENERAL'
  ): RateLimitStatus {
    const config = ENDPOINT_LIMIT_CONFIGS[endpointType];
    const key = `${endpointType}:${clientKey.trim().toLowerCase()}`;
    return this.checkRateLimit(key, config.maxAttempts, config.windowMs);
  }

  /**
   * Checks if a key is rate-limited against max attempts and time window.
   */
  public checkRateLimit(key: string, maxAttempts = 5, windowMs = 60 * 1000): RateLimitStatus {
    const cleanKey = key.trim().toLowerCase();
    const record = this.attemptsMap.get(cleanKey);

    if (!record) {
      return { isBlocked: false, remainingAttempts: maxAttempts };
    }

    const now = Date.now();
    const elapsed = now - record.firstAttemptAt;

    if (elapsed > windowMs) {
      this.attemptsMap.delete(cleanKey);
      return { isBlocked: false, remainingAttempts: maxAttempts };
    }

    if (record.count >= maxAttempts) {
      const resetTimeMs = windowMs - elapsed;
      const resetSeconds = Math.ceil(resetTimeMs / 1000);
      return {
        isBlocked: true,
        remainingAttempts: 0,
        resetTimeMs,
        error: `Rate limit exceeded. Too many requests. Try again in ${resetSeconds} seconds.`,
      };
    }

    return {
      isBlocked: false,
      remainingAttempts: maxAttempts - record.count,
    };
  }

  /**
   * Records a request/failed attempt.
   */
  public recordFailedAttempt(key: string): void {
    const cleanKey = key.trim().toLowerCase();
    const record = this.attemptsMap.get(cleanKey);
    const now = Date.now();

    if (!record) {
      this.attemptsMap.set(cleanKey, { count: 1, firstAttemptAt: now });
    } else {
      record.count += 1;
      this.attemptsMap.set(cleanKey, record);
    }
  }

  /**
   * Resets counter upon successful authentication or task completion.
   */
  public resetAttempts(key: string): void {
    const cleanKey = key.trim().toLowerCase();
    this.attemptsMap.delete(cleanKey);
  }

  private purgeStaleEntries(): void {
    const now = Date.now();
    for (const [key, record] of this.attemptsMap.entries()) {
      if (now - record.firstAttemptAt > 15 * 60 * 1000) {
        this.attemptsMap.delete(key);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();
