import {
  CRMCustomerProfileDTO,
  CRMCustomerSummary,
  MembershipTierType,
} from '../../../types/customer-crm.types';
import { ltvCalculatorService } from './ltv-calculator.service';
import { rewardService } from './reward.service';
import { customerNotesService } from './customer-notes.service';

export interface CRMFilterParams {
  searchQuery?: string;
  membershipTier?: MembershipTierType;
  minLTV?: number;
  maxLTV?: number;
  tag?: string;
  birthdayMonth?: number;
  page?: number;
  limit?: number;
}

export interface Customer360Details {
  summary: CRMCustomerSummary;
  rewardHistory: any[];
  notes: any[];
  orderHistory: any[];
}

/**
 * Enterprise Service for CRM Customer Queries, 360-Degree Context, and Profile Updates.
 */
export class CRMCustomerService {
  private static instance: CRMCustomerService | null = null;
  // Demo customer accounts store: Map<customerId, { name: string; phone: string; email: string }>
  private customerAccounts: Map<string, { name: string; phone: string; email: string }> = new Map();

  private constructor() {
    this.seedDemoCustomerAccounts();
  }

  public static getInstance(): CRMCustomerService {
    if (!CRMCustomerService.instance) {
      CRMCustomerService.instance = new CRMCustomerService();
    }
    return CRMCustomerService.instance;
  }

  /**
   * Queries paginated customer CRM list with rich multi-criteria filters.
   */
  public async queryCustomers(
    merchantId: string,
    filters: CRMFilterParams = {}
  ): Promise<{ customers: CRMCustomerSummary[]; totalCount: number; page: number; totalPages: number }> {
    const profiles = await ltvCalculatorService.getAllMerchantProfiles(merchantId);

    let summaries: CRMCustomerSummary[] = [];

    for (const p of profiles) {
      const acct = this.customerAccounts.get(p.customerId) || {
        name: `Customer #${p.customerId.slice(-4)}`,
        phone: '+8801700000000',
        email: null,
      };

      const notes = await customerNotesService.getCustomerNotes(merchantId, p.customerId);

      summaries.push({
        id: p.customerId,
        merchantId,
        name: acct.name,
        phone: acct.phone,
        email: acct.email,
        profile: p,
        notesCount: notes.length,
        addressSummary: 'Dhaka, Bangladesh',
      });
    }

    // Apply Filter Controls
    if (filters.membershipTier) {
      summaries = summaries.filter((c) => c.profile.membershipTier === filters.membershipTier);
    }

    if (filters.minLTV !== undefined) {
      summaries = summaries.filter((c) => c.profile.lifetimeValue >= filters.minLTV!);
    }

    if (filters.maxLTV !== undefined) {
      summaries = summaries.filter((c) => c.profile.lifetimeValue <= filters.maxLTV!);
    }

    if (filters.tag) {
      summaries = summaries.filter((c) => c.profile.tags.includes(filters.tag!));
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      summaries = summaries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 15;
    const totalCount = summaries.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginatedCustomers = summaries.slice(startIndex, startIndex + limit);

    return {
      customers: paginatedCustomers,
      totalCount,
      page,
      totalPages,
    };
  }

  /**
   * Retrieves 360-degree customer profile context (orders, reward ledger, staff notes).
   */
  public async getCustomer360Details(
    merchantId: string,
    customerId: string
  ): Promise<Customer360Details | null> {
    const { customers } = await this.queryCustomers(merchantId, {});
    const summary = customers.find((c) => c.id === customerId);

    if (!summary) return null;

    const rewardHistory = await rewardService.getCustomerRewardHistory(customerId);
    const notes = await customerNotesService.getCustomerNotes(merchantId, customerId);

    const orderHistory = [
      {
        orderId: 'ord-1001',
        orderNumber: 'ORD-20260801-9901',
        grandTotal: 2870,
        currentStatus: 'PROCESSING',
        createdAt: new Date().toISOString(),
      },
    ];

    return {
      summary,
      rewardHistory,
      notes,
      orderHistory,
    };
  }

  /**
   * Updates customer profile fields, tags, and birthday.
   */
  public async updateCustomerProfileDetails(
    merchantId: string,
    customerId: string,
    data: { name?: string; phone?: string; email?: string; tags?: string[]; dateOfBirth?: string; gender?: string }
  ): Promise<CRMCustomerSummary> {
    const profile = await ltvCalculatorService.getCustomerProfile(merchantId, customerId);
    if (!profile) {
      throw new Error(`Customer CRM profile "${customerId}" not found.`);
    }

    if (data.tags) {
      profile.tags = data.tags;
    }

    if (data.dateOfBirth) {
      profile.dateOfBirth = data.dateOfBirth;
    }

    if (data.gender) {
      profile.gender = data.gender;
    }

    profile.updatedAt = new Date().toISOString();

    const acct = this.customerAccounts.get(customerId) || {
      name: 'Customer',
      phone: '+8801700000000',
      email: null,
    };

    if (data.name) acct.name = data.name;
    if (data.phone) acct.phone = data.phone;
    if (data.email !== undefined) acct.email = data.email;

    this.customerAccounts.set(customerId, acct);

    const notes = await customerNotesService.getCustomerNotes(merchantId, customerId);

    return {
      id: customerId,
      merchantId,
      name: acct.name,
      phone: acct.phone,
      email: acct.email,
      profile,
      notesCount: notes.length,
    };
  }

  private seedDemoCustomerAccounts(): void {
    this.customerAccounts.set('cust-101', {
      name: 'Karim Ahmed',
      phone: '+8801700112233',
      email: 'karim@gmail.com',
    });

    this.customerAccounts.set('cust-102', {
      name: 'Nusrat Jahan',
      phone: '+8801811223344',
      email: 'nusrat@gmail.com',
    });
  }
}

export const crmCustomerService = CRMCustomerService.getInstance();
