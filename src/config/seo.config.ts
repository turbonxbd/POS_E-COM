import { siteConfig } from './site.config';

export interface MetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Dynamic Metadata Generator for SEO compliance, OpenGraph, Twitter Cards, and Canonical URLs.
 */
export function generatePublicPageMetadata(options: MetadataOptions = {}) {
  const pageTitle = options.title
    ? `${options.title} | ${siteConfig.metadata.name}`
    : siteConfig.metadata.title;

  const pageDescription = options.description || siteConfig.metadata.description;
  const canonical = options.canonicalUrl || siteConfig.metadata.url;
  const ogImageUrl = options.ogImage || `${siteConfig.metadata.url}${siteConfig.metadata.ogImage}`;
  const keywords = options.keywords || [
    'multi-tenant ecommerce',
    'saas platform',
    'b2b store builder',
    'antigravity platform',
  ];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords.join(', '),
    metadataBase: new URL(siteConfig.metadata.url),
    alternates: {
      canonical,
    },
    robots: {
      index: !options.noIndex,
      follow: !options.noIndex,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      siteName: siteConfig.metadata.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl],
    },
  };
}

/**
 * JSON-LD Structured Data Helpers for Search Engine Organization & Software Schema.
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.metadata.name,
    url: siteConfig.metadata.url,
    logo: `${siteConfig.metadata.url}/images/logo.png`,
    sameAs: [
      siteConfig.metadata.links.github,
      siteConfig.metadata.links.docs,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@antigravity.app',
    },
  };
}

export function generateSoftwareAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.metadata.name,
    operatingSystem: 'All',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '19.00',
      highPrice: '199.00',
      offerCount: '3',
    },
  };
}
