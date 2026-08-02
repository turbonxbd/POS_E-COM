import { getCurrentMerchantUser } from '../../lib/session';
import { SessionUser } from '../../types/merchant-auth.types';

export interface MerchantGuardResult {
  isAuthorized: boolean;
  user: SessionUser | null;
  merchantId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Validates merchant user session and enforces tenant database isolation.
 */
export async function validateMerchantApiAccess(request: Request): Promise<MerchantGuardResult> {
  const cookieHeader = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';
  const tokenSource = cookieHeader || authHeader;

  // Extract session user from token or cookie
  const user = getCurrentMerchantUser(tokenSource);

  // Fallback for development/testing if header not passed
  if (!user && process.env.NODE_ENV !== 'production') {
    const mockDevUser: SessionUser = {
      id: 'usr-owner-01',
      merchantId: 'merch-techstore',
      name: 'Rahim Ahmed',
      email: 'owner@techstore.com',
      role: 'OWNER',
      tenantSlug: 'techstore-bd',
    };
    return {
      isAuthorized: true,
      user: mockDevUser,
      merchantId: mockDevUser.merchantId,
    };
  }

  if (!user) {
    return {
      isAuthorized: false,
      user: null,
      error: 'Unauthorized: Valid merchant session token is required.',
      statusCode: 401,
    };
  }

  return {
    isAuthorized: true,
    user,
    merchantId: user.merchantId,
  };
}
