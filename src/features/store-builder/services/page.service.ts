import { CustomPageDTO } from '../../../types/store-builder.types';

/**
 * Enterprise Service for Managing Storefront Custom Pages & Auto-Generating Bangladesh E-Commerce Policy Templates.
 */
export class StorePageService {
  private static instance: StorePageService | null = null;
  private pagesStore: Map<string, CustomPageDTO[]> = new Map();

  private constructor() {
    this.seedDemoPages();
  }

  public static getInstance(): StorePageService {
    if (!StorePageService.instance) {
      StorePageService.instance = new StorePageService();
    }
    return StorePageService.instance;
  }

  /**
   * Retrieves all custom pages for a merchant storefront.
   */
  public async getCustomPages(merchantId: string): Promise<CustomPageDTO[]> {
    return this.pagesStore.get(merchantId) || [];
  }

  /**
   * Creates or updates a custom page.
   */
  public async createOrUpdatePage(
    merchantId: string,
    payload: CustomPageDTO
  ): Promise<CustomPageDTO> {
    const list = this.pagesStore.get(merchantId) || [];

    const pageId = payload.id || `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const pageRecord: CustomPageDTO = {
      ...payload,
      id: pageId,
      merchantId,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    const index = list.findIndex((p) => p.id === pageId || p.slug === payload.slug);
    if (index >= 0) {
      list[index] = pageRecord;
    } else {
      list.push(pageRecord);
    }

    this.pagesStore.set(merchantId, list);
    return pageRecord;
  }

  /**
   * Deletes a custom page by ID.
   */
  public async deletePage(merchantId: string, pageId: string): Promise<boolean> {
    const list = this.pagesStore.get(merchantId) || [];
    const filtered = list.filter((p) => p.id !== pageId);

    if (filtered.length === list.length) return false;

    this.pagesStore.set(merchantId, filtered);
    return true;
  }

  /**
   * Auto-generates standard Bangladesh e-commerce policy page templates (Privacy Policy, Terms of Service, Return & Refund, Shipping Policy).
   */
  public async generateDefaultPolicyPages(
    merchantId: string,
    storeName = 'Our Store'
  ): Promise<CustomPageDTO[]> {
    const defaultPages: CustomPageDTO[] = [
      {
        id: `page-privacy-${Date.now()}`,
        merchantId,
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        contentHtml: `<h1>Privacy Policy for ${storeName}</h1><p>At ${storeName}, accessible from our online storefront, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by ${storeName} and how we use it in accordance with the laws of Bangladesh.</p>`,
        isPublished: true,
        metaTitle: `Privacy Policy | ${storeName}`,
        metaDescription: `Read the official Privacy Policy for ${storeName}.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `page-terms-${Date.now()}`,
        merchantId,
        title: 'Terms & Conditions',
        slug: 'terms-and-conditions',
        contentHtml: `<h1>Terms & Conditions</h1><p>Welcome to ${storeName}! These terms and conditions outline the rules and regulations for the use of ${storeName}'s Website and Online Purchasing Services in Bangladesh.</p>`,
        isPublished: true,
        metaTitle: `Terms & Conditions | ${storeName}`,
        metaDescription: `Review terms of service for placing orders on ${storeName}.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `page-returns-${Date.now()}`,
        merchantId,
        title: 'Return & Refund Policy',
        slug: 'return-policy',
        contentHtml: `<h1>Return & Refund Policy</h1><p>Thank you for shopping at ${storeName}. We offer a 7-day return policy for defective or incorrect products shipped across Bangladesh. Returned items must be unused and in original packaging.</p>`,
        isPublished: true,
        metaTitle: `7-Day Return & Refund Policy | ${storeName}`,
        metaDescription: `Learn about our hassle-free 7-day return and refund process at ${storeName}.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `page-shipping-${Date.now()}`,
        merchantId,
        title: 'Shipping & Delivery Policy',
        slug: 'shipping-policy',
        contentHtml: `<h1>Shipping & Delivery Information</h1><p>We deliver products nationwide in Bangladesh via Steadfast Courier and Pathao Courier. Delivery takes 24-48 hours inside Dhaka and 2-4 days outside Dhaka.</p>`,
        isPublished: true,
        metaTitle: `Shipping & Nationwide Delivery | ${storeName}`,
        metaDescription: `Delivery timelines and shipping charges for ${storeName} orders across Bangladesh.`,
        createdAt: new Date().toISOString(),
      },
    ];

    const currentList = this.pagesStore.get(merchantId) || [];
    const combined = [...currentList, ...defaultPages];
    this.pagesStore.set(merchantId, combined);

    return defaultPages;
  }

  private seedDemoPages(): void {
    const demoId = 'merch-techstore';
    const seed: CustomPageDTO[] = [
      {
        id: 'page-about',
        merchantId: demoId,
        title: 'About TechStore BD',
        slug: 'about-us',
        contentHtml: '<h1>About TechStore BD</h1><p>We are Bangladesh’s leading gadgets retailer offering 100% original electronics since 2020.</p>',
        isPublished: true,
        metaTitle: 'About Us | TechStore BD',
        metaDescription: 'Learn about TechStore BD mission and team.',
        createdAt: new Date().toISOString(),
      },
    ];
    this.pagesStore.set(demoId, seed);
  }
}

export const storePageService = StorePageService.getInstance();
