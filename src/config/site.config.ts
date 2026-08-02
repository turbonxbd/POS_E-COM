/**
 * Site metadata configuration interface.
 */
export interface SiteMetadata {
  name: string;
  title: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github?: string;
    docs?: string;
    support?: string;
  };
}

/**
 * Global site & localization configuration contract.
 */
export interface SiteConfig {
  metadata: SiteMetadata;
  defaultLocale: string;
  supportedLocales: readonly string[];
  fallbackTheme: 'light' | 'dark' | 'system';
  dateFormat: string;
  timeFormat: string;
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

/**
 * Frozen, immutable site configuration object.
 */
export const siteConfig: Readonly<SiteConfig> = Object.freeze({
  metadata: {
    name: 'Antigravity Platform',
    title: 'Antigravity Multi-Tenant Platform',
    description: 'Next-generation enterprise-grade multi-tenant web application framework.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ogImage: '/images/og-image.png',
    links: {
      github: 'https://github.com',
      docs: 'https://docs.example.com',
      support: 'https://support.example.com',
    },
  },
  defaultLocale: 'en',
  supportedLocales: ['en', 'bn'] as const,
  fallbackTheme: 'system',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
});
