export type StoreFontFamilyType = 'Inter' | 'Roboto' | 'Poppins' | 'Hind Siliguri';

export type SSLStatusType = 'PENDING' | 'ACTIVE' | 'FAILED';

export interface HeaderStyleConfig {
  layout: 'standard' | 'centered' | 'minimal';
  sticky: boolean;
  showSearch: boolean;
  showCartBadge: boolean;
}

export interface FooterStyleConfig {
  layout: 'multi-column' | 'simple' | 'compact';
  copyrightText: string;
  showSocialIcons: boolean;
  showPaymentBadge: boolean;
}

export interface BannerSliderItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AnnouncementBarConfig {
  id: string;
  contentText: string;
  linkUrl?: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

export interface PopupConfig {
  id: string;
  title: string;
  contentText: string;
  imageUrl?: string;
  triggerDelay: number; // in seconds
  isActive: boolean;
}

export interface StorefrontThemeConfig {
  id: string;
  merchantId: string;
  storeName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: StoreFontFamilyType;
  headerStyle: HeaderStyleConfig;
  footerStyle: FooterStyleConfig;
  sliders: BannerSliderItem[];
  announcements: AnnouncementBarConfig[];
  popups: PopupConfig[];
}

export interface CustomPageDTO {
  id?: string;
  merchantId: string;
  title: string;
  slug: string;
  contentHtml: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
}

export interface DNSRecordItem {
  type: 'CNAME' | 'A' | 'TXT';
  name: string;
  targetValue: string;
  status: 'VERIFIED' | 'UNVERIFIED';
}

export interface CustomDomainVerification {
  id: string;
  merchantId: string;
  customDomain: string;
  isVerified: boolean;
  sslStatus: SSLStatusType;
  dnsRecords: DNSRecordItem[];
}

export const DEFAULT_STOREFRONT_THEME: StorefrontThemeConfig = {
  id: 'cfg-default',
  merchantId: 'merch-techstore',
  storeName: 'TechStore Bangladesh',
  logoUrl: 'https://placehold.co/180x50/2563eb/ffffff?text=TechStore',
  faviconUrl: 'https://placehold.co/32x32/2563eb/ffffff?text=TS',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  fontFamily: 'Inter',
  headerStyle: {
    layout: 'standard',
    sticky: true,
    showSearch: true,
    showCartBadge: true,
  },
  footerStyle: {
    layout: 'multi-column',
    copyrightText: '© 2026 TechStore BD. All rights reserved. Powered by Antigravity SaaS.',
    showSocialIcons: true,
    showPaymentBadge: true,
  },
  sliders: [
    {
      id: 'slide-1',
      title: 'Grand Festival Discount',
      subtitle: 'Get up to 40% OFF on premium gadget collections',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200',
      linkUrl: '/products',
      ctaText: 'Shop Sale',
      sortOrder: 1,
      isActive: true,
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      contentText: '🚚 Free Shipping across Bangladesh on all orders over ৳2,000 BDT!',
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      isActive: true,
    },
  ],
  popups: [],
};
