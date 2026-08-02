import { Plan, CreatePlanDTO, UpdatePlanDTO, PlanLimits } from '../../../types/platform-admin.types';
import { auditService } from './audit.service';
import { merchantService } from './merchant.service';

export interface PlanLimitValidationResult {
  allowed: boolean;
  exceededResource?: 'maxProducts' | 'maxUsers' | 'maxOrders';
  currentUsage: number;
  limitMax: number;
  message?: string;
}

export interface CurrentUsageStats {
  productsCount: number;
  usersCount: number;
  ordersCount: number;
}

/**
 * Enterprise Service for Subscription Plan Management, Resource Limits, and Renewals.
 */
export class PlanService {
  private static instance: PlanService | null = null;
  private plansStore: Map<string, Plan> = new Map();

  private constructor() {
    this.seedInitialPlans();
  }

  public static getInstance(): PlanService {
    if (!PlanService.instance) {
      PlanService.instance = new PlanService();
    }
    return PlanService.instance;
  }

  /**
   * Creates a new subscription plan tier.
   */
  public async createPlan(dto: CreatePlanDTO, adminId = 'system'): Promise<Plan> {
    const existingName = Array.from(this.plansStore.values()).find(
      (p) => p.name.toLowerCase() === dto.name.toLowerCase()
    );
    if (existingName) {
      throw new Error(`Plan with name "${dto.name}" already exists.`);
    }

    const newPlan: Plan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: dto.name,
      description: dto.description || null,
      monthlyPrice: dto.monthlyPrice,
      yearlyPrice: dto.yearlyPrice,
      trialDays: dto.trialDays ?? 14,
      features: dto.features,
      limits: dto.limits,
      isActive: dto.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.plansStore.set(newPlan.id, newPlan);

    await auditService.logAdminAction({
      adminId,
      action: 'CREATE_PLAN',
      targetResource: `Plan:${newPlan.id}`,
      details: { name: newPlan.name, monthlyPrice: newPlan.monthlyPrice },
    });

    return newPlan;
  }

  /**
   * Retrieves all subscription plans.
   */
  public async getPlans(includeInactive = true): Promise<Plan[]> {
    const plans = Array.from(this.plansStore.values());
    return includeInactive ? plans : plans.filter((p) => p.isActive);
  }

  /**
   * Retrieves a plan by ID.
   */
  public async getPlanById(id: string): Promise<Plan | null> {
    return this.plansStore.get(id) ?? null;
  }

  /**
   * Updates an existing subscription plan.
   */
  public async updatePlan(id: string, dto: UpdatePlanDTO, adminId = 'system'): Promise<Plan> {
    const existing = await this.getPlanById(id);
    if (!existing) {
      throw new Error(`Plan with ID "${id}" not found.`);
    }

    const updated: Plan = {
      ...existing,
      ...dto,
      limits: dto.limits ? ({ ...existing.limits, ...dto.limits } as PlanLimits) : existing.limits,
      updatedAt: new Date().toISOString(),
    };

    this.plansStore.set(id, updated);

    await auditService.logAdminAction({
      adminId,
      action: 'UPDATE_PLAN',
      targetResource: `Plan:${id}`,
      details: dto as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Toggles plan active status.
   */
  public async togglePlanActive(id: string, adminId = 'system'): Promise<Plan> {
    const existing = await this.getPlanById(id);
    if (!existing) {
      throw new Error(`Plan with ID "${id}" not found.`);
    }

    return this.updatePlan(id, { isActive: !existing.isActive }, adminId);
  }

  /**
   * Deletes a plan if no active merchants are assigned.
   */
  public async deletePlan(id: string, adminId = 'system'): Promise<boolean> {
    const existing = await this.getPlanById(id);
    if (!existing) return false;

    // Check if any merchant is actively using this plan
    const allMerchants = await merchantService.searchMerchants({ pageSize: 1000 });
    const isPlanInUse = allMerchants.items.some((m) => m.planId === id && m.status !== 'CANCELLED');

    if (isPlanInUse) {
      throw new Error(`Cannot delete plan "${existing.name}". Active merchants are assigned to it.`);
    }

    this.plansStore.delete(id);

    await auditService.logAdminAction({
      adminId,
      action: 'DELETE_PLAN',
      targetResource: `Plan:${id}`,
    });

    return true;
  }

  /**
   * Validates if a merchant's current resource usage exceeds their subscription plan limits.
   */
  public async validatePlanLimits(
    merchantId: string,
    usage: CurrentUsageStats
  ): Promise<PlanLimitValidationResult> {
    const merchant = await merchantService.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID "${merchantId}" not found.`);
    }

    const plan = await this.getPlanById(merchant.planId);
    if (!plan) {
      throw new Error(`Plan "${merchant.planId}" assigned to merchant not found.`);
    }

    if (usage.productsCount > plan.limits.maxProducts) {
      return {
        allowed: false,
        exceededResource: 'maxProducts',
        currentUsage: usage.productsCount,
        limitMax: plan.limits.maxProducts,
        message: `Product limit reached (${usage.productsCount}/${plan.limits.maxProducts}). Please upgrade your plan.`,
      };
    }

    if (usage.usersCount > plan.limits.maxUsers) {
      return {
        allowed: false,
        exceededResource: 'maxUsers',
        currentUsage: usage.usersCount,
        limitMax: plan.limits.maxUsers,
        message: `User limit reached (${usage.usersCount}/${plan.limits.maxUsers}). Please upgrade your plan.`,
      };
    }

    if (usage.ordersCount > plan.limits.maxOrders) {
      return {
        allowed: false,
        exceededResource: 'maxOrders',
        currentUsage: usage.ordersCount,
        limitMax: plan.limits.maxOrders,
        message: `Monthly order limit reached (${usage.ordersCount}/${plan.limits.maxOrders}). Please upgrade your plan.`,
      };
    }

    return { allowed: true, currentUsage: 0, limitMax: 0 };
  }

  /**
   * Extends or renews a merchant's subscription period.
   */
  public async renewSubscription(
    merchantId: string,
    durationMonths: number,
    paymentRef: string,
    adminId = 'system'
  ): Promise<{ merchantId: string; newTrialEndsAt: string; renewedMonths: number }> {
    const merchant = await merchantService.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID "${merchantId}" not found.`);
    }

    const currentExpiry = merchant.trialEndsAt ? new Date(merchant.trialEndsAt).getTime() : Date.now();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + durationMonths * 30 * 86400000).toISOString();

    await merchantService.updateMerchant(merchantId, { trialEndsAt: newExpiry, status: 'ACTIVE' }, adminId);

    await auditService.logAdminAction({
      adminId,
      action: 'RENEW_SUBSCRIPTION',
      targetResource: `Merchant:${merchantId}`,
      details: { durationMonths, paymentRef, newExpiry },
    });

    return {
      merchantId,
      newTrialEndsAt: newExpiry,
      renewedMonths: durationMonths,
    };
  }

  private seedInitialPlans(): void {
    const seed: Plan[] = [
      {
        id: 'plan-starter',
        name: 'Starter Plan',
        description: 'Ideal for small retail businesses starting out.',
        monthlyPrice: 19.0,
        yearlyPrice: 190.0,
        trialDays: 14,
        features: ['Up to 100 Products', 'Basic Analytics', 'Standard Support'],
        limits: {
          maxProducts: 100,
          maxUsers: 2,
          maxOrders: 500,
          customDomainAllowed: false,
          analyticsAccess: false,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'plan-pro',
        name: 'Professional Plan',
        description: 'Growing merchants requiring custom domain and unlimited orders.',
        monthlyPrice: 49.0,
        yearlyPrice: 490.0,
        trialDays: 14,
        features: ['Up to 1,000 Products', 'Custom Domain Support', 'Advanced Analytics', 'Priority Email Support'],
        limits: {
          maxProducts: 1000,
          maxUsers: 5,
          maxOrders: 5000,
          customDomainAllowed: true,
          analyticsAccess: true,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise Plan',
        description: 'Unlimited scale for high-volume enterprise brands.',
        monthlyPrice: 199.0,
        yearlyPrice: 1990.0,
        trialDays: 30,
        features: ['Unlimited Products', 'Custom Domain', 'Dedicated Account Manager', '24/7 Phone Support'],
        limits: {
          maxProducts: 100000,
          maxUsers: 50,
          maxOrders: 100000,
          customDomainAllowed: true,
          analyticsAccess: true,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    seed.forEach((p) => this.plansStore.set(p.id, p));
  }
}

export const planService = PlanService.getInstance();
