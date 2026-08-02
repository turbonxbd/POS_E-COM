import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSecurityHeaders, getCORSHeaders, validateAllowedOrigin } from './lib/security';
import { rateLimiter } from './lib/rate-limiter';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  // 1. CORS Preflight OPTIONS Handling
  if (request.method === 'OPTIONS') {
    if (!validateAllowedOrigin(origin)) {
      return new NextResponse(null, { status: 403, statusText: 'Forbidden CORS Origin' });
    }
    const corsHeaders = getCORSHeaders(origin);
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // 2. Rate Limiting Check for Sensitive API Routes
  if (pathname.includes('/api/merchant/auth/login')) {
    const rateCheck = rateLimiter.checkEndpointRateLimit(ip, 'LOGIN');
    if (rateCheck.isBlocked) {
      return new NextResponse(
        JSON.stringify({ success: false, error: rateCheck.error }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (pathname.includes('/api/storefront/checkout')) {
    const rateCheck = rateLimiter.checkEndpointRateLimit(ip, 'CHECKOUT');
    if (rateCheck.isBlocked) {
      return new NextResponse(
        JSON.stringify({ success: false, error: rateCheck.error }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (pathname.includes('/api/merchant/pos/sync')) {
    const rateCheck = rateLimiter.checkEndpointRateLimit(ip, 'POS_SYNC');
    if (rateCheck.isBlocked) {
      return new NextResponse(
        JSON.stringify({ success: false, error: rateCheck.error }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Inject Security Headers and CORS to Response
  const response = NextResponse.next();
  const secHeaders = getSecurityHeaders();
  const corsHeaders = getCORSHeaders(origin);

  Object.entries(secHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
