import { TenantConfig } from '../types/tenant.types';
import { localStore } from '../lib/storage';

export interface TenantState {
  currentTenant: TenantConfig | null;
  tenantId: string | null;
  tenantSlug: string | null;
  isLoading: boolean;
  error: string | null;
}

type TenantStoreListener = (state: TenantState) => void;

/**
 * Lightweight, SSR-safe reactive Tenant Store for active tenant management and switching.
 */
export class TenantStore {
  private static instance: TenantStore | null = null;
  private state: TenantState;
  private listeners = new Set<TenantStoreListener>();

  private constructor() {
    const initialTenant = localStore.getItem<TenantConfig>('active_tenant', null);
    const initialSlug = localStore.getItem<string>('tenant_id', initialTenant?.slug ?? null);

    this.state = {
      currentTenant: initialTenant,
      tenantId: initialTenant?.id ?? null,
      tenantSlug: initialSlug,
      isLoading: false,
      error: null,
    };
  }

  public static getInstance(): TenantStore {
    if (!TenantStore.instance) {
      TenantStore.instance = new TenantStore();
    }
    return TenantStore.instance;
  }

  public getState(): TenantState {
    return { ...this.state };
  }

  public setTenant(tenant: TenantConfig): void {
    this.state = {
      currentTenant: tenant,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      isLoading: false,
      error: null,
    };

    localStore.setItem('active_tenant', tenant);
    localStore.setItem('tenant_id', tenant.slug);

    this.notify();
  }

  public clearTenant(): void {
    this.state = {
      currentTenant: null,
      tenantId: null,
      tenantSlug: null,
      isLoading: false,
      error: null,
    };

    localStore.removeItem('active_tenant');
    localStore.removeItem('tenant_id');

    this.notify();
  }

  public setLoading(isLoading: boolean): void {
    this.state = { ...this.state, isLoading };
    this.notify();
  }

  public setError(error: string | null): void {
    this.state = { ...this.state, error, isLoading: false };
    this.notify();
  }

  public subscribe(listener: TenantStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

export const tenantStore = TenantStore.getInstance();
