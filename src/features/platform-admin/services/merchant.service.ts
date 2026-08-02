import { Merchant, CreateMerchantDTO, UpdateMerchantDTO, MerchantStatus } from '../../../types/platform-admin.types';
import { PaginatedResponse, PaginationParams } from '../../../types/api.types';
import { auditService } from './audit.service';

export interface MerchantQueryParams extends PaginationParams {
  status?: MerchantStatus;
  planId?: string;
}

export interface PasswordResetTokenResult {
  merchantId: string;
  email: string;
  resetToken: string;
  resetUrl: string;
  expiresAt: string;
}

/**
 * Enterprise Service for SaaS Merchant Provisioning and Lifecycle Management.
 */
export class MerchantService {
  private static instance: MerchantService | null = null;
  private merchantsStore: Map<string, Merchant> = new Map();

  private constructor() {
    this.seedInitialMerchants();
  }

  public static getInstance(): MerchantService {
    if (!MerchantService.instance) {
      MerchantService.instance = new MerchantService();
    }
    return MerchantService.instance;
  }

  /**
   * Provisions a new merchant workspace account.
   */
  public async createMerchant(dto: CreateMerchantDTO, adminId = 'system'): Promise<Merchant> {
    // 1. Validate slug collision
    const existingSlug = Array.from(this.merchantsStore.values()).find(
      (m) => m.slug.toLowerCase() === dto.slug.toLowerCase()
    );
    if (existingSlug) {
      throw new Error(`Merchant slug "${dto.slug}" is already taken.`);
    }

    // 2. Validate custom domain collision
    if (dto.customDomain) {
      const existingDomain = Array.from(this.merchantsStore.values()).find(
        (m) => m.customDomain?.toLowerCase() === dto.customDomain?.toLowerCase()
      );
      if (existingDomain) {
        throw new Error(`Custom domain "${dto.customDomain}" is already in use.`);
      }
    }

    const trialDays = dto.trialDays ?? 14;
    const trialEndsAt = new Date(Date.now() + trialDays * 86400000).toISOString();

    const newMerchant: Merchant = {
      id: `mch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: dto.name,
      slug: dto.slug.toLowerCase(),
      customDomain: dto.customDomain ? dto.customDomain.toLowerCase() : null,
      ownerName: dto.ownerName,
      email: dto.email.toLowerCase(),
      phone: dto.phone || null,
      status: 'ACTIVE',
      planId: dto.planId,
      trialEndsAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.merchantsStore.set(newMerchant.id, newMerchant);

    // Audit log action
    await auditService.logAdminAction({
      adminId,
      action: 'PROVISION_MERCHANT',
      targetResource: `Merchant:${newMerchant.id}`,
      details: { slug: newMerchant.slug, planId: newMerchant.planId },
    });

    return newMerchant;
  }

  /**
   * Retrieves merchant by ID.
   */
  public async getMerchantById(id: string): Promise<Merchant | null> {
    return this.merchantsStore.get(id) ?? null;
  }

  /**
   * Updates merchant details.
   */
  public async updateMerchant(id: string, dto: UpdateMerchantDTO, adminId = 'system'): Promise<Merchant> {
    const existing = await this.getMerchantById(id);
    if (!existing) {
      throw new Error(`Merchant with ID "${id}" not found.`);
    }

    const updated: Merchant = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.merchantsStore.set(id, updated);

    await auditService.logAdminAction({
      adminId,
      action: 'UPDATE_MERCHANT',
      targetResource: `Merchant:${id}`,
      details: dto as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Instantly suspends a merchant workspace.
   */
  public async suspendMerchant(id: string, reason?: string, adminId = 'system'): Promise<Merchant> {
    const merchant = await this.updateMerchant(id, { status: 'SUSPENDED' }, adminId);

    await auditService.logAdminAction({
      adminId,
      action: 'SUSPEND_MERCHANT',
      targetResource: `Merchant:${id}`,
      details: { reason: reason || 'Suspended by platform administrator.' },
    });

    return merchant;
  }

  /**
   * Re-activates a suspended or pending merchant account.
   */
  public async activateMerchant(id: string, adminId = 'system'): Promise<Merchant> {
    const merchant = await this.updateMerchant(id, { status: 'ACTIVE' }, adminId);

    await auditService.logAdminAction({
      adminId,
      action: 'ACTIVATE_MERCHANT',
      targetResource: `Merchant:${id}`,
    });

    return merchant;
  }

  /**
   * Safely deletes a merchant workspace.
   */
  public async deleteMerchant(id: string, hardDelete = false, adminId = 'system'): Promise<boolean> {
    const existing = await this.getMerchantById(id);
    if (!existing) return false;

    if (hardDelete) {
      this.merchantsStore.delete(id);
    } else {
      await this.updateMerchant(id, { status: 'CANCELLED' }, adminId);
    }

    await auditService.logAdminAction({
      adminId,
      action: hardDelete ? 'HARD_DELETE_MERCHANT' : 'SOFT_DELETE_MERCHANT',
      targetResource: `Merchant:${id}`,
    });

    return true;
  }

  /**
   * Generates a password reset link/token for the merchant owner.
   */
  public async resetMerchantPassword(id: string, adminId = 'system'): Promise<PasswordResetTokenResult> {
    const merchant = await this.getMerchantById(id);
    if (!merchant) {
      throw new Error(`Merchant with ID "${id}" not found.`);
    }

    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 3600000 * 24).toISOString(); // 24 hours valid
    const resetUrl = `https://${merchant.slug}.domain.com/auth/reset-password?token=${resetToken}`;

    await auditService.logAdminAction({
      adminId,
      action: 'RESET_MERCHANT_PASSWORD',
      targetResource: `Merchant:${id}`,
      details: { ownerEmail: merchant.email },
    });

    return {
      merchantId: merchant.id,
      email: merchant.email,
      resetToken,
      resetUrl,
      expiresAt,
    };
  }

  /**
   * Searches and filters merchants with pagination.
   */
  public async searchMerchants(params: MerchantQueryParams = {}): Promise<PaginatedResponse<Merchant>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    let items = Array.from(this.merchantsStore.values());

    if (params.status) {
      items = items.filter((m) => m.status === params.status);
    }

    if (params.planId) {
      items = items.filter((m) => m.planId === params.planId);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          m.ownerName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.customDomain && m.customDomain.toLowerCase().includes(q))
      );
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginated = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginated,
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private seedInitialMerchants(): void {
    const seed: Merchant[] = [
      {
        id: 'mch-01',
        name: 'TechStore BD',
        slug: 'techstore-bd',
        customDomain: 'shop.techstore.com',
        ownerName: 'Rahim Ahmed',
        email: 'rahim@techstore.com',
        phone: '+8801711002233',
        status: 'ACTIVE',
        planId: 'plan-pro',
        trialEndsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mch-02',
        name: 'Fashion Hub',
        slug: 'fashion-hub',
        ownerName: 'Nusrat Jahan',
        email: 'nusrat@fashionhub.com',
        phone: '+8801811002244',
        status: 'ACTIVE',
        planId: 'plan-enterprise',
        trialEndsAt: null,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    seed.forEach((m) => this.merchantsStore.set(m.id, m));
  }
}

export const merchantService = MerchantService.getInstance();
