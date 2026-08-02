import { siteConfig } from '../config/site.config';

/**
 * Supported locales type derived from site configuration.
 */
export type SupportedLocale = (typeof siteConfig.supportedLocales)[number];

/**
 * Key-value mapping structure for translation dictionaries.
 */
export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

/**
 * Configuration options for I18nEngine initialization and behavior.
 */
export interface I18nOptions {
  defaultLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  storageKey?: string;
  autoDetectBrowserLocale?: boolean;
}

/**
 * Callback function signature for locale change subscriptions.
 */
export type LocaleChangeListener = (newLocale: SupportedLocale) => void;
