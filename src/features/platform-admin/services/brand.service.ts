import { BrandSetting, UpdateBrandSettingDTO } from '../../../types/platform-admin.types';
import { auditService } from './audit.service';
import { ThemeEngine } from '../../../core/theme/theme.engine';

/**
 * Enterprise Service for Platform Global Brand Settings, Aesthetics, and SEO Configuration.
 */
export class BrandService {
  private static instance: BrandService | null = null;
  private brandSettings: BrandSetting;

  private constructor() {
    this.brandSettings = {
      id: 'brand-global-01',
      brandName: 'Antigravity SaaS Platform',
      logoUrl: '/images/logo.svg',
      faviconUrl: '/favicon.ico',
      primaryColor: '#2563eb',
      themeMode: 'system',
      email: 'support@antigravity.app',
      phone: '+1 (800) 555-0199',
      socialLinks: {
        facebook: 'https://facebook.com/antigravity',
        twitter: 'https://twitter.com/antigravity',
        linkedin: 'https://linkedin.com/company/antigravity',
        github: 'https://github.com/antigravity',
      },
      seoConfig: {
        metaTitle: 'Antigravity Platform - Next-Gen Multi-Tenant eCommerce Solution',
        metaDescription: 'Empowering merchants with enterprise-grade multi-tenant eCommerce infrastructure.',
        metaKeywords: ['multi-tenant', 'saas', 'ecommerce', 'antigravity'],
        ogImageUrl: '/images/og-cover.png',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public static getInstance(): BrandService {
    if (!BrandService.instance) {
      BrandService.instance = new BrandService();
    }
    return BrandService.instance;
  }

  /**
   * Retrieves active platform global brand and SEO configuration.
   */
  public async getBrandSettings(): Promise<BrandSetting> {
    return { ...this.brandSettings };
  }

  /**
   * Updates platform global brand, theme, and SEO settings.
   */
  public async updateBrandSettings(dto: UpdateBrandSettingDTO, adminId = 'system'): Promise<BrandSetting> {
    this.brandSettings = {
      ...this.brandSettings,
      logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : this.brandSettings.logoUrl,
      faviconUrl: dto.faviconUrl !== undefined ? dto.faviconUrl : this.brandSettings.faviconUrl,
      brandName: dto.brandName ?? this.brandSettings.brandName,
      primaryColor: dto.primaryColor ?? this.brandSettings.primaryColor,
      themeMode: dto.themeMode ?? this.brandSettings.themeMode,
      email: dto.email ?? this.brandSettings.email,
      phone: dto.phone !== undefined ? dto.phone : this.brandSettings.phone,
      socialLinks: dto.socialLinks ? { ...this.brandSettings.socialLinks, ...dto.socialLinks } : this.brandSettings.socialLinks,
      seoConfig: dto.seoConfig ? { ...this.brandSettings.seoConfig, ...dto.seoConfig } : this.brandSettings.seoConfig,
      updatedAt: new Date().toISOString(),
    };

    // Apply primary color and theme mode to ThemeEngine if browser environment
    if (typeof document !== 'undefined') {
      ThemeEngine.applyTenantTheme({
        primaryColor: this.brandSettings.primaryColor,
        secondaryColor: '#64748b',
        darkModeEnabled: this.brandSettings.themeMode === 'dark',
      });
    }

    await auditService.logAdminAction({
      adminId,
      action: 'UPDATE_BRAND_SETTINGS',
      targetResource: 'BrandSetting:Global',
      details: { brandName: this.brandSettings.brandName, primaryColor: this.brandSettings.primaryColor },
    });

    return { ...this.brandSettings };
  }
}

export const brandService = BrandService.getInstance();
