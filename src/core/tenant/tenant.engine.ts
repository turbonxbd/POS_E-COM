import { TenantResolutionMode } from '../../types/tenant.types';
import { env } from '../../config/env.config';

/**
 * Options required for resolving tenant context from incoming requests or current window location.
 */
export interface TenantResolutionOptions {
  hostname?: string;
  pathname?: string;
  headers?: Record<string, string | string[] | undefined> | Headers;
  mode?: TenantResolutionMode;
  rootDomain?: string;
  fallbackTenantSlug?: string | null;
}

/**
 * Utility class for multi-tenant resolution across subdomains, URL paths, and request headers.
 */
export class TenantResolver {
  private static DEFAULT_HEADER_KEY = 'x-tenant-id';

  /**
   * Resolves tenant slug from a hostname subdomain (e.g., tenant1.example.com -> tenant1).
   */
  public static resolveFromSubdomain(hostname?: string, rootDomain: string = env.rootDomain): string | null {
    if (!hostname) return null;

    // Clean port number if present (e.g., localhost:3000 -> localhost)
    const cleanHost = hostname.split(':')[0].toLowerCase();
    const cleanRoot = rootDomain.split(':')[0].toLowerCase();

    // Check for IP address or localhost without subdomains
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === cleanRoot) {
      return null;
    }

    if (cleanHost.endsWith(`.${cleanRoot}`)) {
      const subdomain = cleanHost.replace(`.${cleanRoot}`, '').trim();
      return subdomain.length > 0 && subdomain !== 'www' ? subdomain : null;
    }

    // Fallback for custom domains: if hostname has subdomains (e.g. acme.app.com)
    const parts = cleanHost.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }

    return null;
  }

  /**
   * Resolves tenant slug from a URL pathname (e.g., /tenant1/dashboard -> tenant1).
   */
  public static resolveFromPath(pathname?: string): string | null {
    if (!pathname) return null;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const candidate = segments[0].toLowerCase();
    // Exclude system reserved path prefixes
    const reservedPaths = ['api', 'static', '_next', 'favicon.ico', 'assets', 'admin', 'auth'];
    if (reservedPaths.includes(candidate)) {
      return null;
    }

    return candidate;
  }

  /**
   * Resolves tenant identifier from incoming request headers (e.g. X-Tenant-ID).
   */
  public static resolveFromHeader(
    headers?: Record<string, string | string[] | undefined> | Headers,
    headerKey: string = TenantResolver.DEFAULT_HEADER_KEY
  ): string | null {
    if (!headers) return null;

    let headerValue: string | null | undefined = null;

    if (typeof (headers as Headers).get === 'function') {
      headerValue = (headers as Headers).get(headerKey) || (headers as Headers).get(headerKey.toLowerCase());
    } else {
      const record = headers as Record<string, string | string[] | undefined>;
      const matchedKey = Object.keys(record).find((k) => k.toLowerCase() === headerKey.toLowerCase());
      if (matchedKey) {
        const val = record[matchedKey];
        headerValue = Array.isArray(val) ? val[0] : val;
      }
    }

    if (headerValue && typeof headerValue === 'string' && headerValue.trim().length > 0) {
      return headerValue.trim().toLowerCase();
    }

    return null;
  }

  /**
   * Main entry point to resolve tenant identifier based on configured resolution mode.
   */
  public static resolve(options: TenantResolutionOptions = {}): string | null {
    const mode = options.mode || env.tenantMode;
    const rootDomain = options.rootDomain || env.rootDomain;
    const fallback = options.fallbackTenantSlug !== undefined ? options.fallbackTenantSlug : null;

    let resolvedTenant: string | null = null;

    switch (mode) {
      case 'subdomain':
        resolvedTenant = TenantResolver.resolveFromSubdomain(options.hostname, rootDomain);
        break;
      case 'path':
        resolvedTenant = TenantResolver.resolveFromPath(options.pathname);
        break;
      case 'header':
        resolvedTenant = TenantResolver.resolveFromHeader(options.headers);
        break;
      default:
        resolvedTenant = TenantResolver.resolveFromSubdomain(options.hostname, rootDomain);
    }

    // Fallback logic if resolution failed or for root domain access

    return resolvedTenant || fallback;
  }
}

export function extractTenantSlugFromHost(hostname?: string, rootDomain?: string): string | null {
  return TenantResolver.resolveFromSubdomain(hostname, rootDomain);
}

