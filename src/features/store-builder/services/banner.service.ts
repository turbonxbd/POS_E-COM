import { BannerSliderItem } from '../../../types/store-builder.types';

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  sortOrder?: number;
}

/**
 * Enterprise Service for Managing Hero Banner Sliders & Carousel Images.
 */
export class StoreBannerService {
  private static instance: StoreBannerService | null = null;
  private bannersStore: Map<string, BannerSliderItem[]> = new Map();

  private constructor() {
    this.seedDemoBanners();
  }

  public static getInstance(): StoreBannerService {
    if (!StoreBannerService.instance) {
      StoreBannerService.instance = new StoreBannerService();
    }
    return StoreBannerService.instance;
  }

  /**
   * Retrieves sorted list of active hero slider banners for a merchant storefront.
   */
  public async getBanners(merchantId: string): Promise<BannerSliderItem[]> {
    const list = this.bannersStore.get(merchantId) || [];
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Adds a new banner slide to the storefront hero carousel.
   */
  public async createBanner(
    merchantId: string,
    payload: CreateBannerPayload
  ): Promise<BannerSliderItem> {
    const list = this.bannersStore.get(merchantId) || [];

    const newSlide: BannerSliderItem = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: payload.title,
      subtitle: payload.subtitle,
      imageUrl: payload.imageUrl,
      linkUrl: payload.linkUrl || '/products',
      ctaText: payload.ctaText || 'Shop Now',
      sortOrder: payload.sortOrder !== undefined ? payload.sortOrder : list.length + 1,
      isActive: true,
    };

    list.push(newSlide);
    this.bannersStore.set(merchantId, list);
    return newSlide;
  }

  /**
   * Updates an existing banner slide.
   */
  public async updateBanner(
    merchantId: string,
    bannerId: string,
    payload: Partial<CreateBannerPayload> & { isActive?: boolean }
  ): Promise<BannerSliderItem | null> {
    const list = this.bannersStore.get(merchantId) || [];
    const index = list.findIndex((b) => b.id === bannerId);

    if (index === -1) return null;

    const current = list[index];
    const updated: BannerSliderItem = {
      ...current,
      ...payload,
    };

    list[index] = updated;
    this.bannersStore.set(merchantId, list);
    return updated;
  }

  /**
   * Deletes a banner slide from the storefront.
   */
  public async deleteBanner(merchantId: string, bannerId: string): Promise<boolean> {
    const list = this.bannersStore.get(merchantId) || [];
    const filtered = list.filter((b) => b.id !== bannerId);

    if (filtered.length === list.length) return false;

    this.bannersStore.set(merchantId, filtered);
    return true;
  }

  private seedDemoBanners(): void {
    const demoId = 'merch-techstore';
    const seed: BannerSliderItem[] = [
      {
        id: 'slide-101',
        title: 'Grand Festival Sale',
        subtitle: 'Get up to 40% OFF on original smart watches & headphones',
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200',
        linkUrl: '/products',
        ctaText: 'Shop Deals',
        sortOrder: 1,
        isActive: true,
      },
      {
        id: 'slide-102',
        title: 'New Laptop Arrivals 2026',
        subtitle: 'Explore high performance laptops with official brand warranty',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
        linkUrl: '/category/laptops',
        ctaText: 'Explore Laptops',
        sortOrder: 2,
        isActive: true,
      },
    ];
    this.bannersStore.set(demoId, seed);
  }
}

export const storeBannerService = StoreBannerService.getInstance();
