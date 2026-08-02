import { UserRole, User } from '../../types/auth.types';

export type RouteType = 'public' | 'auth' | 'super_admin' | 'tenant_protected';

export interface RouteGuardOptions {
  pathname: string;
  user: User | null;
  activeTenantSlug?: string | null;
}

export interface RouteGuardResult {
  allowed: boolean;
  redirectUrl?: string;
  reason?: string;
}

/**
 * Route protection rules registry and path classifier.
 */
export class RouteGuard {
  private static PUBLIC_PATHS = ['/', '/about', '/contact', '/privacy', '/terms'];
  private static AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
  private static SUPER_ADMIN_PREFIX = '/admin';

  /**
   * Classifies a given URL pathname into route types.
   */
  public static classifyRoute(pathname: string): RouteType {
    const cleanPath = pathname.toLowerCase().split('?')[0];

    if (RouteGuard.AUTH_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(`${p}/`))) {
      return 'auth';
    }

    if (RouteGuard.PUBLIC_PATHS.some((p) => cleanPath === p)) {
      return 'public';
    }

    if (cleanPath === RouteGuard.SUPER_ADMIN_PREFIX || cleanPath.startsWith(`${RouteGuard.SUPER_ADMIN_PREFIX}/`)) {
      return 'super_admin';
    }

    return 'tenant_protected';
  }

  /**
   * Extracts target tenant slug from a pathname (e.g. /acme-corp/dashboard -> acme-corp).
   */
  public static extractTenantSlugFromPath(pathname: string): string | null {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const firstSegment = segments[0].toLowerCase();
    const reserved = ['api', 'static', '_next', 'favicon.ico', 'assets', 'admin', 'login', 'register', 'forgot-password', 'about', 'terms', 'privacy'];
    
    if (reserved.includes(firstSegment)) {
      return null;
    }

    return firstSegment;
  }

  /**
   * Main route protection decision matrix evaluator.
   */
  public static evaluate(options: RouteGuardOptions): RouteGuardResult {
    const { pathname, user, activeTenantSlug } = options;
    const routeType = RouteGuard.classifyRoute(pathname);
    const isAuthenticated = Boolean(user);

    // Rule 1: Public non-auth pages are always accessible
    if (routeType === 'public') {
      return { allowed: true };
    }

    // Rule 2: Auth Pages (/login, /register, etc.)
    if (routeType === 'auth') {
      if (isAuthenticated && user) {
        const defaultTenant = activeTenantSlug || user.tenantId || 'dashboard';
        return {
          allowed: false,
          redirectUrl: `/${defaultTenant}/dashboard`,
          reason: 'Authenticated users are redirected away from login/register pages.',
        };
      }
      return { allowed: true };
    }

    // Rule 3: Protected Routes for Unauthenticated Users
    if (!isAuthenticated || !user) {
      const encodedRedirect = encodeURIComponent(pathname);
      return {
        allowed: false,
        redirectUrl: `/login?redirect=${encodedRedirect}`,
        reason: 'Unauthenticated user attempting to access protected route.',
      };
    }

    // Rule 4: Super Admin Routes (/admin/...)
    if (routeType === 'super_admin') {
      if (user.role === ('SUPER_ADMIN' as UserRole)) {
        return { allowed: true };
      }
      const userTenant = user.tenantId || 'dashboard';
      return {
        allowed: false,
        redirectUrl: `/${userTenant}/dashboard`,
        reason: 'User lacks Super Admin role privileges.',
      };
    }

    // Rule 5: Tenant Protected Routes (/[tenantSlug]/...)
    if (routeType === 'tenant_protected') {
      const requestedTenantSlug = RouteGuard.extractTenantSlugFromPath(pathname);

      // Super Admins can access any tenant workspace
      if (user.role === ('SUPER_ADMIN' as UserRole)) {
        return { allowed: true };
      }

      // If URL contains a tenant slug, verify user membership
      if (requestedTenantSlug && requestedTenantSlug !== user.tenantId.toLowerCase()) {
        return {
          allowed: false,
          redirectUrl: `/${user.tenantId}/dashboard`,
          reason: `User is not authorized to access tenant "${requestedTenantSlug}".`,
        };
      }
    }

    return { allowed: true };
  }
}
