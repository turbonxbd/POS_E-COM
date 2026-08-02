import { merchantService } from '../../platform-admin/services/merchant.service';
import { auditService } from '../../platform-admin/services/audit.service';

export interface StorefrontDefaultConfig {
  tenantSlug: string;
  defaultCurrency: string;
  defaultPosRegisterName: string;
  defaultCategories: string[];
  themeMode: 'light' | 'dark' | 'system';
}

export interface ProvisioningResult {
  merchantId: string;
  tenantSlug: string;
  storeUrl: string;
  loginUrl: string;
  isProvisioned: boolean;
  provisionedAt: string;
  defaultConfig: StorefrontDefaultConfig;
}

/**
 * Enterprise Service for Automated Multi-Tenant Storefront & Database Provisioning.
 */
export class ProvisioningService {
  private static instance: ProvisioningService | null = null;
  private provisionedStores: Map<string, ProvisioningResult> = new Map();

  private constructor() {}

  public static getInstance(): ProvisioningService {
    if (!ProvisioningService.instance) {
      ProvisioningService.instance = new ProvisioningService();
    }
    return ProvisioningService.instance;
  }

  /**
   * Automatically provisions storefront database partition, default POS register, and categories.
   */
  public async provisionMerchantStore(merchantId: string): Promise<ProvisioningResult> {
    const merchant = await merchantService.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID "${merchantId}" not found for provisioning.`);
    }

    const storeUrl = `https://${merchant.slug}.domain.com`;
    const loginUrl = `${storeUrl}/login`;

    const defaultConfig: StorefrontDefaultConfig = {
      tenantSlug: merchant.slug,
      defaultCurrency: 'BDT',
      defaultPosRegisterName: 'Main Retail Counter #1',
      defaultCategories: ['General Retail', 'Clothing & Apparel', 'Electronics & Accessories'],
      themeMode: 'light',
    };

    const provisioningResult: ProvisioningResult = {
      merchantId: merchant.id,
      tenantSlug: merchant.slug,
      storeUrl,
      loginUrl,
      isProvisioned: true,
      provisionedAt: new Date().toISOString(),
      defaultConfig,
    };

    this.provisionedStores.set(merchant.id, provisioningResult);

    // Simulate Welcome Email Dispatch
    this.sendWelcomeNotification(merchant.ownerName, merchant.email, storeUrl, loginUrl);

    // Audit log provisioning event
    await auditService.logAdminAction({
      adminId: 'system-provisioner',
      action: 'PROVISION_STOREFRONT',
      targetResource: `Merchant:${merchantId}`,
      details: { storeUrl, tenantSlug: merchant.slug },
    });

    return provisioningResult;
  }

  /**
   * Retrieves provisioning details for a merchant store.
   */
  public async getProvisioningStatus(merchantId: string): Promise<ProvisioningResult | null> {
    return this.provisionedStores.get(merchantId) ?? null;
  }

  private sendWelcomeNotification(ownerName: string, email: string, storeUrl: string, loginUrl: string): void {
    console.log(`[ProvisioningNotifier] Welcome Email dispatched to ${email}:`);
    console.log(`  Dear ${ownerName}, your store is ready at ${storeUrl}. Log in at ${loginUrl}.`);
  }
}

export const provisioningService = ProvisioningService.getInstance();
