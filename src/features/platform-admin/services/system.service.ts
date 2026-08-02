import { SystemConfig, UpdateSystemConfigDTO } from '../../../types/platform-admin.types';
import { auditService } from './audit.service';

export interface MaintenanceModeStatus {
  isMaintenanceMode: boolean;
  bypassKey?: string;
  updatedAt: string;
}

/**
 * Enterprise Service for System Configuration, Feature Flags, Maintenance Mode, and Integrations.
 */
export class SystemService {
  private static instance: SystemService | null = null;
  private config: SystemConfig;
  private activeBypassKey: string | null = null;

  private constructor() {
    this.config = {
      id: 'sys-config-01',
      isMaintenanceMode: false,
      featureFlags: {
        registrationEnabled: true,
        bkashGatewayEnabled: true,
        nagadGatewayEnabled: true,
        stripeGatewayEnabled: true,
        smsNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        analyticsDashboardEnabled: true,
      },
      smtpConfig: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: true,
        user: 'postmaster@antigravity.app',
        pass: 'super_secret_smtp_password_123',
        fromEmail: 'noreply@antigravity.app',
        fromName: 'Antigravity Platform',
      },
      smsGatewayConfig: {
        provider: 'ssl_wireless',
        apiKey: 'ssl_api_key_secret_9988',
        senderId: 'ANTIGRAVITY',
      },
      paymentGatewayConfig: {
        stripePublicKey: 'pk_live_51M...',
        stripeSecretKey: 'sk_live_51M_secret_999',
        bkashAppKey: 'bkash_app_key_8877',
        bkashAppSecret: 'bkash_app_secret_7766',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public static getInstance(): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService();
    }
    return SystemService.instance;
  }

  /**
   * Retrieves active system configuration with sensitive secrets masked for security.
   */
  public async getSystemConfig(maskSecrets = true): Promise<SystemConfig> {
    if (!maskSecrets) {
      return { ...this.config };
    }

    return {
      ...this.config,
      smtpConfig: {
        ...this.config.smtpConfig,
        pass: this.config.smtpConfig.pass ? '••••••••••••' : '',
      },
      smsGatewayConfig: {
        ...this.config.smsGatewayConfig,
        apiKey: this.config.smsGatewayConfig.apiKey ? '••••••••••••' : '',
      },
      paymentGatewayConfig: {
        ...this.config.paymentGatewayConfig,
        stripeSecretKey: this.config.paymentGatewayConfig.stripeSecretKey ? '••••••••••••' : undefined,
        bkashAppSecret: this.config.paymentGatewayConfig.bkashAppSecret ? '••••••••••••' : undefined,
      },
    };
  }

  /**
   * Updates global system configuration, feature flags, and integrations.
   */
  public async updateSystemConfig(dto: UpdateSystemConfigDTO, adminId = 'system'): Promise<SystemConfig> {
    this.config = {
      ...this.config,
      isMaintenanceMode: dto.isMaintenanceMode !== undefined ? dto.isMaintenanceMode : this.config.isMaintenanceMode,
      featureFlags: dto.featureFlags ? { ...this.config.featureFlags, ...dto.featureFlags } : this.config.featureFlags,
      smtpConfig: dto.smtpConfig ? { ...this.config.smtpConfig, ...dto.smtpConfig } : this.config.smtpConfig,
      smsGatewayConfig: dto.smsGatewayConfig ? { ...this.config.smsGatewayConfig, ...dto.smsGatewayConfig } : this.config.smsGatewayConfig,
      paymentGatewayConfig: dto.paymentGatewayConfig
        ? { ...this.config.paymentGatewayConfig, ...dto.paymentGatewayConfig }
        : this.config.paymentGatewayConfig,
      updatedAt: new Date().toISOString(),
    };

    await auditService.logAdminAction({
      adminId,
      action: 'UPDATE_SYSTEM_CONFIG',
      targetResource: 'SystemConfig:Global',
      details: { isMaintenanceMode: this.config.isMaintenanceMode },
    });

    return this.getSystemConfig(true);
  }

  /**
   * Toggles global maintenance mode with an optional dynamic bypass key.
   */
  public async toggleMaintenanceMode(enabled: boolean, adminId = 'system'): Promise<MaintenanceModeStatus> {
    this.config.isMaintenanceMode = enabled;
    this.config.updatedAt = new Date().toISOString();

    if (enabled) {
      this.activeBypassKey = `maint_bypass_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    } else {
      this.activeBypassKey = null;
    }

    await auditService.logAdminAction({
      adminId,
      action: enabled ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE',
      targetResource: 'SystemConfig:MaintenanceMode',
      details: { bypassKey: this.activeBypassKey },
    });

    return {
      isMaintenanceMode: enabled,
      bypassKey: this.activeBypassKey || undefined,
      updatedAt: this.config.updatedAt,
    };
  }

  /**
   * Verifies if a provided maintenance bypass key is valid.
   */
  public verifyBypassKey(key: string): boolean {
    return Boolean(this.activeBypassKey && this.activeBypassKey === key);
  }

  /**
   * Toggles a specific feature flag on or off.
   */
  public async toggleFeatureFlag(flagName: string, enabled: boolean, adminId = 'system'): Promise<Record<string, boolean>> {
    this.config.featureFlags[flagName] = enabled;
    this.config.updatedAt = new Date().toISOString();

    await auditService.logAdminAction({
      adminId,
      action: 'TOGGLE_FEATURE_FLAG',
      targetResource: `FeatureFlag:${flagName}`,
      details: { enabled },
    });

    return { ...this.config.featureFlags };
  }
}

export const systemService = SystemService.getInstance();
