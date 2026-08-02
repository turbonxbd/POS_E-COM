export interface SocialLinksPayload {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface SEOMetadataPayload {
  metaTitle: string;
  metaDescription: string;
  keywords?: string[];
  ogImageUrl?: string;
}

export interface StoreSEOConfig {
  merchantId: string;
  socialLinks: SocialLinksPayload;
  seoMetadata: SEOMetadataPayload;
}

/**
 * Enterprise Service for Managing Merchant Storefront Social Media Links & Search Engine Optimization (SEO).
 */
export class StoreSEOService {
  private static instance: StoreSEOService | null = null;
  private seoStore: Map<string, StoreSEOConfig> = new Map();

  private constructor() {}

  public static getInstance(): StoreSEOService {
    if (!StoreSEOService.instance) {
      StoreSEOService.instance = new StoreSEOService();
    }
    return StoreSEOService.instance;
  }

  /**
   * Retrieves active social links and SEO metadata for a merchant.
   */
  public async getStoreSEO(merchantId: string): Promise<StoreSEOConfig> {
    const existing = this.seoStore.get(merchantId);
    if (existing) return existing;

    const defaultConfig: StoreSEOConfig = {
      merchantId,
      socialLinks: {
        facebook: 'https://facebook.com/techstorebd',
        instagram: 'https://instagram.com/techstorebd',
        whatsapp: '+8801711002233',
      },
      seoMetadata: {
        metaTitle: 'TechStore Bangladesh | Premium Gadgets & Accessories',
        metaDescription: 'Shop original laptops, smartphones, and gadgets online with fast nationwide delivery in Bangladesh.',
        keywords: ['gadgets', 'electronics', 'tech store bd', 'online shopping bangladesh'],
        ogImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200',
      },
    };

    this.seoStore.set(merchantId, defaultConfig);
    return defaultConfig;
  }

  /**
   * Updates social media profile links.
   */
  public async updateSocialLinks(
    merchantId: string,
    links: SocialLinksPayload
  ): Promise<StoreSEOConfig> {
    const current = await this.getStoreSEO(merchantId);

    const updated: StoreSEOConfig = {
      ...current,
      socialLinks: {
        ...current.socialLinks,
        ...links,
      },
    };

    this.seoStore.set(merchantId, updated);
    return updated;
  }

  /**
   * Updates meta title, meta description, keywords, and OpenGraph image URL.
   */
  public async updateStoreSEO(
    merchantId: string,
    seoData: SEOMetadataPayload
  ): Promise<StoreSEOConfig> {
    const current = await this.getStoreSEO(merchantId);

    const updated: StoreSEOConfig = {
      ...current,
      seoMetadata: {
        ...current.seoMetadata,
        ...seoData,
      },
    };

    this.seoStore.set(merchantId, updated);
    return updated;
  }
}

export const storeSEOService = StoreSEOService.getInstance();
