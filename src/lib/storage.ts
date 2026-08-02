/**
 * Options for configuring SafeStorage behavior.
 */
export interface StorageOptions {
  prefix?: string;
  type?: 'local' | 'session';
}

/**
 * In-memory fallback storage when window.localStorage/sessionStorage is unavailable.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

/**
 * Type-safe, SSR-resilient wrapper for browser storage APIs with automatic JSON parsing and error handling.
 */
export class SafeStorage {
  private prefix: string;
  private storage: Storage;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? 'ag_';
    this.storage = this.resolveStorage(options.type ?? 'local');
  }

  /**
   * Retrieves an item from storage and parses JSON safely. Returns fallback if missing or corrupt.
   */
  public getItem<T>(key: string, fallbackValue: T | null = null): T | null {
    const prefixedKey = this.getPrefixedKey(key);
    try {
      const item = this.storage.getItem(prefixedKey);
      if (item === null || item === undefined) {
        return fallbackValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[SafeStorage] Failed to read or parse item "${prefixedKey}":`, error);
      return fallbackValue;
    }
  }

  /**
   * Serializes and sets an item in storage.
   */
  public setItem<T>(key: string, value: T): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(prefixedKey, serialized);
      return true;
    } catch (error) {
      console.error(`[SafeStorage] Failed to set item "${prefixedKey}":`, error);
      return false;
    }
  }

  /**
   * Removes a specific item from storage by key.
   */
  public removeItem(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    try {
      this.storage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`[SafeStorage] Failed to remove item "${prefixedKey}":`, error);
      return false;
    }
  }

  /**
   * Checks if an item exists in storage.
   */
  public hasItem(key: string): boolean {
    return this.getItem(key, null) !== null;
  }

  /**
   * Clears all storage keys managed under this instance's prefix.
   */
  public clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => this.storage.removeItem(k));
      return true;
    } catch (error) {
      console.error(`[SafeStorage] Failed to clear prefixed items:`, error);
      return false;
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private resolveStorage(type: 'local' | 'session'): Storage {
    if (typeof window === 'undefined') {
      return new MemoryStorage();
    }

    try {
      const target = type === 'session' ? window.sessionStorage : window.localStorage;
      // Test storage access
      const testKey = `__ag_test__`;
      target.setItem(testKey, '1');
      target.removeItem(testKey);
      return target;
    } catch {
      console.warn(`[SafeStorage] ${type}Storage is unavailable or restricted. Using memory fallback.`);
      return new MemoryStorage();
    }
  }
}

// Ready-to-use exported instances
export const localStore = new SafeStorage({ type: 'local', prefix: 'ag_' });
export const sessionStore = new SafeStorage({ type: 'session', prefix: 'ag_' });
