import { siteConfig } from '../../config/site.config';
import { SupportedLocale, TranslationDictionary, LocaleChangeListener, I18nOptions } from '../../types/i18n.types';
import { dictionaries } from './locales';

/**
 * Core Language & Internationalization (i18n) Engine.
 * Supports locale state handling, dynamic dictionary loading, interpolation, and language switching.
 */
export class I18nEngine {
  private static instance: I18nEngine | null = null;
  private static STORAGE_KEY = 'ag_locale';

  private currentLocale: SupportedLocale;
  private fallbackLocale: SupportedLocale;
  private registeredDictionaries: Map<SupportedLocale, TranslationDictionary>;
  private listeners: Set<LocaleChangeListener>;

  constructor(options: I18nOptions = {}) {
    this.fallbackLocale = options.fallbackLocale || (siteConfig.defaultLocale as SupportedLocale) || 'en';
    this.listeners = new Set<LocaleChangeListener>();
    this.registeredDictionaries = new Map<SupportedLocale, TranslationDictionary>();

    // Load initial embedded dictionaries
    Object.entries(dictionaries).forEach(([loc, dict]) => {
      this.registeredDictionaries.set(loc as SupportedLocale, dict);
    });

    // Resolve initial locale from storage, browser, or options
    const initialLocale = options.defaultLocale || this.detectInitialLocale(options.autoDetectBrowserLocale ?? true);
    this.currentLocale = this.isValidLocale(initialLocale) ? initialLocale : this.fallbackLocale;

    this.updateHtmlLangAttribute(this.currentLocale);
  }

  /**
   * Returns the singleton instance of the I18nEngine.
   */
  public static getInstance(options?: I18nOptions): I18nEngine {
    if (!I18nEngine.instance) {
      I18nEngine.instance = new I18nEngine(options);
    }
    return I18nEngine.instance;
  }

  /**
   * Returns current active locale identifier.
   */
  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Dynamically switches active locale and triggers subscriber notifications.
   */
  public setLocale(locale: SupportedLocale): void {
    if (!this.isValidLocale(locale)) {
      console.warn(`[I18nEngine] Unsupported locale: "${locale}". Fallback retained.`);
      return;
    }

    if (this.currentLocale === locale) return;

    this.currentLocale = locale;
    this.persistLocale(locale);
    this.updateHtmlLangAttribute(locale);
    this.notifyListeners();
  }

  /**
   * Translates a given key with support for dot notation (e.g. 'common.welcome')
   * and variable parameter interpolation (e.g. {name}).
   */
  public translate(key: string, params?: Record<string, string | number>, fallback?: string): string {
    if (!key) return fallback || '';

    // Search target locale dictionary first, then fallback locale
    const primaryDict = this.registeredDictionaries.get(this.currentLocale);
    let rawTranslation = this.resolveNestedKey(primaryDict, key);

    if (rawTranslation === null && this.currentLocale !== this.fallbackLocale) {
      const fallbackDict = this.registeredDictionaries.get(this.fallbackLocale);
      rawTranslation = this.resolveNestedKey(fallbackDict, key);
    }

    if (rawTranslation === null) {
      return fallback !== undefined ? fallback : key;
    }

    return this.interpolate(rawTranslation, params);
  }

  /**
   * Shorthand alias for translate().
   */
  public t(key: string, params?: Record<string, string | number>, fallback?: string): string {
    return this.translate(key, params, fallback);
  }

  /**
   * Dynamically loads or merges a custom dictionary into runtime memory.
   */
  public loadDictionary(locale: SupportedLocale, dictionary: TranslationDictionary): void {
    const existing = this.registeredDictionaries.get(locale) || {};
    this.registeredDictionaries.set(locale, { ...existing, ...dictionary });
  }

  /**
   * Subscribes a listener callback to locale change events.
   * Returns an un-subscription cleanup function.
   */
  public subscribe(listener: LocaleChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns list of all currently supported locale codes.
   */
  public getSupportedLocales(): readonly SupportedLocale[] {
    return siteConfig.supportedLocales as readonly SupportedLocale[];
  }

  // --- Private Helper Methods ---

  private isValidLocale(locale: string): locale is SupportedLocale {
    return (siteConfig.supportedLocales as readonly string[]).includes(locale);
  }

  private detectInitialLocale(autoDetectBrowser: boolean): SupportedLocale {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(I18nEngine.STORAGE_KEY);
        if (stored && this.isValidLocale(stored)) {
          return stored as SupportedLocale;
        }
      } catch {
        // Storage restricted context fallback
      }

      if (autoDetectBrowser && typeof navigator !== 'undefined') {
        const browserLang = (navigator.language || '').toLowerCase();
        if (browserLang.startsWith('bn')) return 'bn';
        if (browserLang.startsWith('en')) return 'en';
      }
    }

    return (siteConfig.defaultLocale as SupportedLocale) || 'en';
  }

  private persistLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(I18nEngine.STORAGE_KEY, locale);
    } catch {
      // Storage restricted context fallback
    }
  }

  private updateHtmlLangAttribute(locale: SupportedLocale): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('lang', locale);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLocale);
      } catch (err) {
        console.error('[I18nEngine] Error in locale change listener:', err);
      }
    });
  }

  private resolveNestedKey(dictionary: TranslationDictionary | undefined, pathKey: string): string | null {
    if (!dictionary) return null;

    const parts = pathKey.split('.');
    let current: unknown = dictionary;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  private interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params || Object.keys(params).length === 0) return template;

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        return String(params[key]);
      }
      return match;
    });
  }
}

// Standalone global instance & helper exports for convenient consumption
export const i18n = I18nEngine.getInstance();
export const t = (key: string, params?: Record<string, string | number>, fallback?: string): string =>
  i18n.translate(key, params, fallback);
export const setLocale = (locale: SupportedLocale): void => i18n.setLocale(locale);
export const getLocale = (): SupportedLocale => i18n.getLocale();