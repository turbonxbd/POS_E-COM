import { TenantResolutionMode } from '../types/tenant.types';

/**
 * Valid application runtime environments.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Strongly typed structure representing validated application environment variables.
 */
export interface EnvConfig {
  appName: string;
  appUrl: string;
  appEnv: AppEnvironment;
  apiBaseUrl: string;
  apiTimeout: number;
  tenantMode: TenantResolutionMode;
  rootDomain: string;
  authCookieName: string;
}

/**
 * Default environment configuration values for fallback in non-production environments.
 */
const DEFAULT_ENV: EnvConfig = {
  appName: 'Antigravity Platform',
  appUrl: 'http://localhost:3000',
  appEnv: 'development',
  apiBaseUrl: 'http://localhost:3000/api/v1',
  apiTimeout: 15000,
  tenantMode: 'subdomain',
  rootDomain: 'localhost:3000',
  authCookieName: 'ag_auth_token',
};

/**
 * Parses and validates raw process.env variables into a strongly typed, frozen EnvConfig object.
 */
function parseAndValidateEnv(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'production';
  const missingVars: string[] = [];

  // Helper to extract or validate string variables
  const getEnvVar = (key: keyof typeof process.env, defaultValue?: string, requiredInProd = false): string => {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      if (isProduction && requiredInProd) {
        missingVars.push(key);
      }
      return defaultValue ?? '';
    }
    return value.trim();
  };

  const appName = getEnvVar('NEXT_PUBLIC_APP_NAME', DEFAULT_ENV.appName);
  const appUrl = getEnvVar('NEXT_PUBLIC_APP_URL', DEFAULT_ENV.appUrl, true);
  const rawAppEnv = getEnvVar('NEXT_PUBLIC_APP_ENV', DEFAULT_ENV.appEnv);
  const apiBaseUrl = getEnvVar('NEXT_PUBLIC_API_BASE_URL', DEFAULT_ENV.apiBaseUrl, true);
  const rawApiTimeout = getEnvVar('NEXT_PUBLIC_API_TIMEOUT', String(DEFAULT_ENV.apiTimeout));
  const rawTenantMode = getEnvVar('NEXT_PUBLIC_TENANT_MODE', DEFAULT_ENV.tenantMode);
  const rootDomain = getEnvVar('NEXT_PUBLIC_ROOT_DOMAIN', DEFAULT_ENV.rootDomain);
  const authCookieName = getEnvVar('NEXT_PUBLIC_AUTH_COOKIE_NAME', DEFAULT_ENV.authCookieName);

  // Validate App Environment
  const validEnvironments: AppEnvironment[] = ['development', 'staging', 'production'];
  const appEnv: AppEnvironment = validEnvironments.includes(rawAppEnv as AppEnvironment)
    ? (rawAppEnv as AppEnvironment)
    : DEFAULT_ENV.appEnv;

  // Validate Tenant Resolution Mode
  const validTenantModes: TenantResolutionMode[] = ['subdomain', 'path', 'header'];
  const tenantMode: TenantResolutionMode = validTenantModes.includes(rawTenantMode as TenantResolutionMode)
    ? (rawTenantMode as TenantResolutionMode)
    : DEFAULT_ENV.tenantMode;

  // Parse API Timeout with numeric check
  const parsedTimeout = parseInt(rawApiTimeout, 10);
  const apiTimeout = !isNaN(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_ENV.apiTimeout;

  // Throw error if mandatory environment variables are missing in production
  if (missingVars.length > 0) {
    throw new Error(
      `[FATAL] Missing mandatory environment variables for ${appEnv} environment:\n` +
        missingVars.map((v) => ` - ${v}`).join('\n') +
        `\nPlease ensure all required variables are set in your environment configuration.`
    );
  }

  return Object.freeze({
    appName,
    appUrl,
    appEnv,
    apiBaseUrl,
    apiTimeout,
    tenantMode,
    rootDomain,
    authCookieName,
  });
}

/**
 * Immutable, type-safe environment configuration instance.
 */
export const env: EnvConfig = parseAndValidateEnv();
