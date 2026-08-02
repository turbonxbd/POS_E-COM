import { extractTenantSlugFromHost } from '../../src/core/tenant/tenant.engine';

describe('TenantResolver - Unit Tests', () => {
  it('should extract tenant slug from subdomain correctly', () => {
    const slug = extractTenantSlugFromHost('techstore.merchantos.bd', 'merchantos.bd');
    expect(slug).toBe('techstore');
  });

  it('should return null for root domain host', () => {
    const slug = extractTenantSlugFromHost('merchantos.bd', 'merchantos.bd');
    expect(slug).toBeNull();
  });

  it('should return null for www host', () => {
    const slug = extractTenantSlugFromHost('www.merchantos.bd', 'merchantos.bd');
    expect(slug).toBeNull();
  });
});
