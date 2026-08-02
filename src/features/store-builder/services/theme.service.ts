import {
  StorefrontThemeConfig,
  StoreFontFamilyType,
  HeaderStyleConfig,
  FooterStyleConfig,
  DEFAULT_STOREFRONT_THEME,
} from '../../../types/store-builder.types';

export interface UpdateBrandingPayload {
  storeName?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface UpdateColorsAndFontsPayload {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: StoreFontFamilyType;
}

/**
 * Enterprise Service for Managing Merchant Storefront Branding, Color Palettes, Fonts, and Layouts.
 */
export class StorefrontThemeService {
  private static instance: StorefrontThemeService | null = null;
  private themesStore: Map<string, StorefrontThemeConfig> = new Map();

  private constructor() {}

  public static getInstance(): StorefrontThemeService {
    if (!StorefrontThemeService.instance) {
      StorefrontThemeService.instance = new StorefrontThemeService();
    }
    return StorefrontThemeService.instance;
  }

  /**
   * Retrieves active theme configuration for a merchant storefront.
   */
  public async getStorefrontTheme(merchantId: string): Promise<StorefrontThemeConfig> {
    const existing = this.themesStore.get(merchantId);
    if (existing) return existing;

    const defaultTheme: StorefrontThemeConfig = {
      ...DEFAULT_STOREFRONT_THEME,
      merchantId,
    };
    this.themesStore.set(merchantId, defaultTheme);
    return defaultTheme;
  }

  /**
   * Updates store name, logo URL, and favicon URL.
   */
  public async updateBranding(
    merchantId: string,
    payload: UpdateBrandingPayload
  ): Promise<StorefrontThemeConfig> {
    const current = await this.getStorefrontTheme(merchantId);

    const updated: StorefrontThemeConfig = {
      ...current,
      storeName: payload.storeName !== undefined ? payload.storeName : current.storeName,
      logoUrl: payload.logoUrl !== undefined ? payload.logoUrl : current.logoUrl,
      faviconUrl: payload.faviconUrl !== undefined ? payload.faviconUrl : current.faviconUrl,
    };

    this.themesStore.set(merchantId, updated);
    return updated;
  }

  /**
   * Updates primary color, secondary color, background color, text color, and font family.
   */
  public async updateThemeColorsAndFonts(
    merchantId: string,
    payload: UpdateColorsAndFontsPayload
  ): Promise<StorefrontThemeConfig> {
    const current = await this.getStorefrontTheme(merchantId);

    const updated: StorefrontThemeConfig = {
      ...current,
      primaryColor: payload.primaryColor || current.primaryColor,
      secondaryColor: payload.secondaryColor || current.secondaryColor,
      backgroundColor: payload.backgroundColor || current.backgroundColor,
      textColor: payload.textColor || current.textColor,
      fontFamily: payload.fontFamily || current.fontFamily,
    };

    this.themesStore.set(merchantId, updated);
    return updated;
  }

  /**
   * Updates Header and Footer layout configurations.
   */
  public async updateHeaderFooterStyle(
    merchantId: string,
    headerStyle?: Partial<HeaderStyleConfig>,
    footerStyle?: Partial<FooterStyleConfig>
  ): Promise<StorefrontThemeConfig> {
    const current = await this.getStorefrontTheme(merchantId);

    const updated: StorefrontThemeConfig = {
      ...current,
      headerStyle: headerStyle ? { ...current.headerStyle, ...headerStyle } : current.headerStyle,
      footerStyle: footerStyle ? { ...current.footerStyle, ...footerStyle } : current.footerStyle,
    };

    this.themesStore.set(merchantId, updated);
    return updated;
  }
}

export const storefrontThemeService = StorefrontThemeService.getInstance();
