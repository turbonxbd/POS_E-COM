import { TenantThemeCustomization } from '../../types/tenant.types';
import { siteConfig } from '../../config/site.config';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Utility engine for managing dark/light theme modes and dynamic runtime tenant CSS variables.
 */
export class ThemeEngine {
  private static THEME_STORAGE_KEY = 'ag_theme_mode';

  /**
   * Applies the theme mode ('light' | 'dark' | 'system') to the document element.
   */
  public static setThemeMode(mode: ThemeMode): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let targetTheme: 'light' | 'dark' = 'light';

    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      targetTheme = prefersDark ? 'dark' : 'light';
    } else {
      targetTheme = mode;
    }

    document.documentElement.setAttribute('data-theme', targetTheme);

    try {
      localStorage.setItem(ThemeEngine.THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage access errors in restricted browser contexts
    }
  }

  /**
   * Reads current active theme mode from local storage or returns siteConfig fallback.
   */
  public static getStoredThemeMode(): ThemeMode {
    if (typeof window === 'undefined') return siteConfig.fallbackTheme;

    try {
      const stored = localStorage.getItem(ThemeEngine.THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    } catch {
      // Fall through to fallback
    }

    return siteConfig.fallbackTheme;
  }

  /**
   * Dynamically applies custom tenant branding CSS custom properties to the DOM.
   */
  public static applyTenantTheme(theme: TenantThemeCustomization): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor);
      // Generate hover color dynamically if not explicitly specified
      const hoverColor = theme.primaryColor + 'ee';
      root.style.setProperty('--primary-hover', hoverColor);
    }

    if (theme.secondaryColor) {
      root.style.setProperty('--secondary', theme.secondaryColor);
    }

    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor);
    }

    if (theme.fontFamily) {
      root.style.setProperty('--font-family-base', theme.fontFamily);
    }

    if (theme.customCssVariables) {
      Object.entries(theme.customCssVariables).forEach(([key, value]) => {
        const propName = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(propName, value);
      });
    }

    if (theme.darkModeEnabled !== undefined) {
      ThemeEngine.setThemeMode(theme.darkModeEnabled ? 'dark' : 'light');
    }
  }

  /**
   * Resets tenant dynamic inline CSS variable overrides back to default CSS values.
   */
  public static resetTenantTheme(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-hover');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--font-family-base');
  }
}
