import { ThemeEngine, ThemeMode } from '../core/theme/theme.engine';
import { TenantThemeCustomization } from '../types/tenant.types';

export interface ThemeState {
  mode: ThemeMode;
  customBranding: TenantThemeCustomization | null;
}

type ThemeStoreListener = (state: ThemeState) => void;

/**
 * Lightweight, SSR-safe reactive Theme Store delegating to ThemeEngine.
 */
export class ThemeStore {
  private static instance: ThemeStore | null = null;
  private state: ThemeState;
  private listeners = new Set<ThemeStoreListener>();

  private constructor() {
    const initialMode = ThemeEngine.getStoredThemeMode();
    this.state = {
      mode: initialMode,
      customBranding: null,
    };
  }

  public static getInstance(): ThemeStore {
    if (!ThemeStore.instance) {
      ThemeStore.instance = new ThemeStore();
    }
    return ThemeStore.instance;
  }

  public getState(): ThemeState {
    return { ...this.state };
  }

  public setThemeMode(mode: ThemeMode): void {
    ThemeEngine.setThemeMode(mode);
    this.state = {
      ...this.state,
      mode,
    };
    this.notify();
  }

  public applyTenantBranding(branding: TenantThemeCustomization): void {
    ThemeEngine.applyTenantTheme(branding);
    this.state = {
      ...this.state,
      customBranding: branding,
    };
    this.notify();
  }

  public resetTheme(): void {
    ThemeEngine.resetTenantTheme();
    const stored = ThemeEngine.getStoredThemeMode();
    ThemeEngine.setThemeMode(stored);
    this.state = {
      mode: stored,
      customBranding: null,
    };
    this.notify();
  }

  public subscribe(listener: ThemeStoreListener): () => void {
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

export const themeStore = ThemeStore.getInstance();
