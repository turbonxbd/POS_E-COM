export interface TenantResolution {
  tenantSlug: string;
  merchantId: string;
  isCustomDomain: boolean;
  resolvedHost: string;
}

/**
 * Enterprise Multi-Tenant Hostname Resolver.
 * Resolves subdomains (techstore.antigravity.bd) and custom domains (techstorebd.com) to tenant partitions.
 */
export function resolveTenantFromHost(hostname: string): TenantResolution {
  const cleanHost = hostname.trim().toLowerCase().split(':')[0]; // Strip port

  // 1. Localhost or Platform Domain Fallback
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === 'antigravity.bd' ||
    cleanHost === 'www.antigravity.bd'
  ) {
    return {
      tenantSlug: 'techstore-bd',
      merchantId: 'merch-techstore',
      isCustomDomain: false,
      resolvedHost: cleanHost,
    };
  }

  // 2. Subdomain check (e.g. fashionhub.antigravity.bd)
  if (cleanHost.endsWith('.antigravity.bd')) {
    const slug = cleanHost.replace('.antigravity.bd', '');
    return {
      tenantSlug: slug,
      merchantId: `merch-${slug}`,
      isCustomDomain: false,
      resolvedHost: cleanHost,
    };
  }

  // 3. Custom Domain mapping (e.g. techstorebd.com -> techstore-bd)
  return {
    tenantSlug: cleanHost.replace(/[^a-z0-9]/g, '-'),
    merchantId: `merch-custom-${cleanHost}`,
    isCustomDomain: true,
    resolvedHost: cleanHost,
  };
}
