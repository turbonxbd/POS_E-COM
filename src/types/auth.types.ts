/**
 * User roles within the multi-tenant system.
 */
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'MEMBER';

/**
 * Status states for a user account.
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

/**
 * User entity representing system and tenant users.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  tenantId: string;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Active authentication session details.
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  permissions: string[];
}

/**
 * Decoded JWT token payload model.
 */
export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  permissions: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}
