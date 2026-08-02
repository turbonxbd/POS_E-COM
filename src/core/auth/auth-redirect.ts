import { SessionUser } from '../../types/merchant-auth.types';

export interface RedirectEvaluation {
  shouldRedirect: boolean;
  targetPath: string;
  reason: 'UNAUTHENTICATED' | 'EMAIL_UNVERIFIED' | 'SUBSCRIPTION_EXPIRED' | 'ALREADY_AUTHENTICATED' | 'VALID';
}

/**
 * Enterprise Smart Redirect Matrix Evaluating User Authentication, Email Verification, and Subscription Status.
 */
export function evaluateAuthRedirect(
  user: SessionUser | null,
  subscriptionStatus = 'ACTIVE',
  isEmailVerified = true
): RedirectEvaluation {
  // 1. Unauthenticated -> Redirect to Login
  if (!user) {
    return {
      shouldRedirect: true,
      targetPath: '/login',
      reason: 'UNAUTHENTICATED',
    };
  }

  // 2. Email / Phone Unverified -> Redirect to Verification Screen
  if (!isEmailVerified) {
    return {
      shouldRedirect: true,
      targetPath: '/merchant/verify',
      reason: 'EMAIL_UNVERIFIED',
    };
  }

  // 3. Subscription Expired or Unpaid past grace period -> Redirect to Subscription Pricing/Payment Page
  if (['EXPIRED', 'CANCELLED'].includes(subscriptionStatus.toUpperCase())) {
    return {
      shouldRedirect: true,
      targetPath: '/pricing',
      reason: 'SUBSCRIPTION_EXPIRED',
    };
  }

  // 4. Valid User -> Redirect directly to tenant dashboard
  const tenantSlug = user.tenantSlug || 'dashboard';
  return {
    shouldRedirect: false,
    targetPath: `/${tenantSlug}/dashboard`,
    reason: 'VALID',
  };
}

/**
 * Guard preventing authenticated users from visiting public auth pages (/login, /register).
 */
export function preventAuthPageAccessIfLoggedIn(user: SessionUser | null): RedirectEvaluation {
  if (user) {
    const tenantSlug = user.tenantSlug || 'dashboard';
    return {
      shouldRedirect: true,
      targetPath: `/${tenantSlug}/dashboard`,
      reason: 'ALREADY_AUTHENTICATED',
    };
  }

  return {
    shouldRedirect: false,
    targetPath: '',
    reason: 'UNAUTHENTICATED',
  };
}
