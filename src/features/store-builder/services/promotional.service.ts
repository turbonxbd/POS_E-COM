import { AnnouncementBarConfig, PopupConfig } from '../../../types/store-builder.types';

export interface StorePromotionsData {
  announcementBar: AnnouncementBarConfig;
  popup: PopupConfig;
}

/**
 * Enterprise Service for Managing Storefront Top Announcement Bars and Timed Promotional Popups.
 */
export class StorePromotionalService {
  private static instance: StorePromotionalService | null = null;
  private promotionsStore: Map<string, StorePromotionsData> = new Map();

  private constructor() {}

  public static getInstance(): StorePromotionalService {
    if (!StorePromotionalService.instance) {
      StorePromotionalService.instance = new StorePromotionalService();
    }
    return StorePromotionalService.instance;
  }

  /**
   * Fetches current announcement bar and popup settings.
   */
  public async getPromotions(merchantId: string): Promise<StorePromotionsData> {
    const existing = this.promotionsStore.get(merchantId);
    if (existing) return existing;

    const defaultPromos: StorePromotionsData = {
      announcementBar: {
        id: 'ann-1',
        contentText: '🚚 Free Shipping across Bangladesh on all orders over ৳2,000 BDT!',
        linkUrl: '/offers',
        backgroundColor: '#1e293b',
        textColor: '#ffffff',
        isActive: true,
      },
      popup: {
        id: 'pop-1',
        title: 'Get ৳500 Discount Coupon!',
        contentText: 'Subscribe to our mailing list and receive ৳500 OFF on your first purchase.',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
        triggerDelay: 5,
        isActive: false,
      },
    };

    this.promotionsStore.set(merchantId, defaultPromos);
    return defaultPromos;
  }

  /**
   * Updates top header announcement bar text, colors, and link.
   */
  public async updateAnnouncementBar(
    merchantId: string,
    payload: Partial<AnnouncementBarConfig>
  ): Promise<AnnouncementBarConfig> {
    const current = await this.getPromotions(merchantId);

    const updatedBar: AnnouncementBarConfig = {
      ...current.announcementBar,
      ...payload,
    };

    this.promotionsStore.set(merchantId, {
      ...current,
      announcementBar: updatedBar,
    });

    return updatedBar;
  }

  /**
   * Updates promotional popup modal title, content, image, delay seconds, and active status.
   */
  public async updatePopup(
    merchantId: string,
    payload: Partial<PopupConfig>
  ): Promise<PopupConfig> {
    const current = await this.getPromotions(merchantId);

    const updatedPopup: PopupConfig = {
      ...current.popup,
      ...payload,
    };

    this.promotionsStore.set(merchantId, {
      ...current,
      popup: updatedPopup,
    });

    return updatedPopup;
  }
}

export const storePromotionalService = StorePromotionalService.getInstance();
