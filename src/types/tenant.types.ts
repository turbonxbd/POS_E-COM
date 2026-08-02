/**
 * Modes used to resolve tenant identity from incoming requests.
 */
export type TenantResolutionMode = 'subdomain' | 'path' | 'header';

/**
 * Operational status of a tenant.
 */
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PROVISIONING';

/**
 * Custom theme and branding configuration for a tenant.
 */
export interface TenantThemeCustomization {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  darkModeEnabled: boolean;
  customCssVariables?: Record<string, string>;
}

/**
 * Multi-tenant configuration contract.
 */
export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  domain: string;
  customDomain?: string;
  resolutionMode: TenantResolutionMode;
  status: TenantStatus;
  features: string[];
  theme: TenantThemeCustomization;
  createdAt: string;
  updatedAt: string;
}
