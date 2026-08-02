export type MerchantUserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';

export type OTPType = 'EMAIL_VERIFY' | 'PHONE_VERIFY' | 'PASSWORD_RESET' | '2FA';

export interface MerchantUser {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: MerchantUserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface OTPVerification {
  id: string;
  identifier: string;
  codeHash: string;
  type: OTPType;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  role: MerchantUserRole;
  tenantSlug: string;
  avatarUrl?: string | null;
}

// --- DTOs ---

export interface MerchantLoginDTO {
  emailOrSubdomain: string;
  password: string;
  rememberMe?: boolean;
}

export interface MerchantRegisterDTO {
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  businessName: string;
  subdomain: string;
  planId: string;
}

export interface VerifyOTPDTO {
  identifier: string;
  code: string;
  type: OTPType;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface AuthResponseDTO {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
