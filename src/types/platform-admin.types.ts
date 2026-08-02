/**
 * Platform Super Admin Role types.
 */
export type PlatformAdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';

/**
 * SaaS Merchant Operational Status.
 */
export type MerchantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';

/**
 * Billing and Platform Revenue Transaction Status.
 */
export type RevenueStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

/**
 * Dynamic Landing Page CMS Sections.
 */
export type CMSSection = 'HERO' | 'PRICING' | 'FAQ' | 'BLOG' | 'TERMS' | 'PRIVACY' | 'FOOTER';

/**
 * Platform Super Admin Account Entity.
 */
export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: PlatformAdminRole;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * SaaS Merchant Tenant Account Entity.
 */
export interface Merchant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  ownerName: string;
  email: string;
  phone?: string | null;
  status: MerchantStatus;
  planId: string;
  plan?: Plan;
  trialEndsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription Plan Operational Limits.
 */
export interface PlanLimits {
  maxProducts: number;
  maxUsers: number;
  maxOrders: number;
  customDomainAllowed: boolean;
  analyticsAccess: boolean;
  [key: string]: unknown;
}

/**
 * Subscription Plan Tier Entity.
 */
export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Platform Revenue Financial Transaction Record Entity.
 */
export interface PlatformRevenue {
  id: string;
  merchantId: string;
  merchant?: Merchant;
  planId: string;
  plan?: Plan;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: RevenueStatus;
  createdAt: string;
}

/**
 * Landing Page & Platform CMS Content Entity.
 */
export interface CMSContent {
  id: string;
  section: CMSSection;
  title: string;
  slug?: string | null;
  payload: Record<string, unknown>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Social Links Container.
 */
export interface SocialLinksConfig {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
}

/**
 * Global SEO Configuration.
 */
export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
}

/**
 * Platform Global Brand & Styling Configuration Entity.
 */
export interface BrandSetting {
  id: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  brandName: string;
  primaryColor: string;
  themeMode: 'light' | 'dark' | 'system';
  email: string;
  phone?: string | null;
  socialLinks?: SocialLinksConfig | null;
  seoConfig?: SEOConfig | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * SMTP Server Configuration details.
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
}

/**
 * SMS Gateway Configuration details.
 */
export interface SMSGatewayConfig {
  provider: 'twilio' | 'ssl_wireless' | 'bulksms';
  apiKey: string;
  senderId?: string;
}

/**
 * Payment Gateway Credentials.
 */
export interface PaymentGatewayConfig {
  stripePublicKey?: string;
  stripeSecretKey?: string;
  bkashAppKey?: string;
  bkashAppSecret?: string;
}

/**
 * Platform Global System Configuration Entity.
 */
export interface SystemConfig {
  id: string;
  isMaintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  smtpConfig: SMTPConfig;
  smsGatewayConfig: SMSGatewayConfig;
  paymentGatewayConfig: PaymentGatewayConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin Security Audit Log Entity.
 */
export interface AuditLog {
  id: string;
  adminId: string;
  admin?: PlatformAdmin;
  action: string;
  targetResource: string;
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Internal/External System API Key Entity.
 */
export interface SystemAPIKey {
  id: string;
  keyName: string;
  hashedKey: string;
  permissions: string[];
  isRevoked: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

// --- Data Transfer Objects (DTOs) ---

export interface CreateMerchantDTO {
  name: string;
  slug: string;
  customDomain?: string;
  ownerName: string;
  email: string;
  phone?: string;
  planId: string;
  trialDays?: number;
}

export interface UpdateMerchantDTO {
  name?: string;
  customDomain?: string | null;
  ownerName?: string;
  email?: string;
  phone?: string | null;
  status?: MerchantStatus;
  planId?: string;
  trialEndsAt?: string | null;
}

export interface CreatePlanDTO {
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays?: number;
  features: string[];
  limits: PlanLimits;
  isActive?: boolean;
}

export interface UpdatePlanDTO {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  trialDays?: number;
  features?: string[];
  limits?: Partial<PlanLimits>;
  isActive?: boolean;
}

export interface UpdateCMSDTO {
  title?: string;
  slug?: string;
  payload?: Record<string, unknown>;
  isPublished?: boolean;
}

export interface UpdateBrandSettingDTO {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  brandName?: string;
  primaryColor?: string;
  themeMode?: 'light' | 'dark' | 'system';
  email?: string;
  phone?: string | null;
  socialLinks?: SocialLinksConfig;
  seoConfig?: SEOConfig;
}

export interface UpdateSystemConfigDTO {
  isMaintenanceMode?: boolean;
  featureFlags?: Record<string, boolean>;
  smtpConfig?: Partial<SMTPConfig>;
  smsGatewayConfig?: Partial<SMSGatewayConfig>;
  paymentGatewayConfig?: Partial<PaymentGatewayConfig>;
}

export interface CreatePlatformAdminDTO {
  name: string;
  email: string;
  password: string;
  role: PlatformAdminRole;
}

export interface CreateSystemAPIKeyDTO {
  keyName: string;
  permissions: string[];
  expiresInDays?: number;
}

/**
 * Super Admin Analytics & Financial Metrics Summary.
 */
export interface PlatformMetricsSummary {
  totalMerchants: number;
  activeMerchants: number;
  suspendedMerchants: number;
  pendingMerchants: number;
  totalMonthlyRevenue: number;
  totalAnnualRevenue: number;
  newSignupsThisMonth: number;
  activePlansCount: number;
}
