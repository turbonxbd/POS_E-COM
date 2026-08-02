/**
 * Security Headers, Content Security Policy (CSP), and Subdomain CORS Guard Engine.
 */

export const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/(?:[a-z0-9-]+\.)?merchantos\.bd(?::\d+)?$/i,
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
];

/**
 * Returns security hardening HTTP response headers.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Validates if an incoming request Origin is an authorized merchant subdomain or root domain.
 */
export function validateAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin request
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

/**
 * Returns CORS response headers restricted to authorized origins.
 */
export function getCORSHeaders(requestOrigin: string | null): Record<string, string> {
  const isAllowed = validateAllowedOrigin(requestOrigin);
  const allowOrigin = isAllowed && requestOrigin ? requestOrigin : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Tenant-Domain',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
