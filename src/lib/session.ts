import { SessionUser } from '../types/merchant-auth.types';
import { verifyAuthToken, TokenPayload } from './auth-security';

export const SESSION_COOKIE_NAME = 'ag_merchant_session';

/**
 * Creates HttpOnly, Secure, SameSite session cookie header string.
 */
export function createSessionCookie(token: string, rememberMe = false): string {
  const maxAgeSeconds = rememberMe ? 30 * 86400 : 24 * 3600; // 30 days vs 24 hours
  const isProd = process.env.NODE_ENV === 'production';

  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; ${
    isProd ? 'Secure;' : ''
  } SameSite=Lax`;
}

/**
 * Generates expired cookie header string for secure logout.
 */
export function destroySessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

/**
 * Parses and verifies JWT session token from Cookie header or Authorization Bearer header.
 */
export function getCurrentMerchantUser(cookieHeaderOrToken?: string): SessionUser | null {
  if (!cookieHeaderOrToken) return null;

  let token = cookieHeaderOrToken;

  // Extract from Cookie string if present
  if (cookieHeaderOrToken.includes(`${SESSION_COOKIE_NAME}=`)) {
    const match = cookieHeaderOrToken.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) token = match[1];
  }

  // Extract from Bearer Header if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  const payload: TokenPayload | null = verifyAuthToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    merchantId: payload.merchantId,
    name: payload.email.split('@')[0],
    email: payload.email,
    role: payload.role as any,
    tenantSlug: payload.tenantSlug,
  };
}
