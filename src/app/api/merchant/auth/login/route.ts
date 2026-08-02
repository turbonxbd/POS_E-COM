import { loginService } from '../../../../../features/merchant-auth/services/login.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrSubdomain, password, rememberMe, tenantSlug } = body;

    if (!emailOrSubdomain || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email/Subdomain and Password are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    const loginResult = await loginService.authenticateMerchantUser(
      { emailOrSubdomain, password, rememberMe },
      ipAddress,
      userAgent,
      tenantSlug
    );

    if (!loginResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: loginResult.error,
          requiresTwoFactor: loginResult.requiresTwoFactor,
          requiresOTPVerification: loginResult.requiresOTPVerification,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (loginResult.cookieHeader) {
      headers['Set-Cookie'] = loginResult.cookieHeader;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: loginResult.sessionUser,
          accessToken: loginResult.accessToken,
          expiresAt: loginResult.expiresAt,
        },
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to authenticate merchant user login.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
