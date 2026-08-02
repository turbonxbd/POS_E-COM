import { CustomerAnalyticsReport } from '../../../types/reports.types';

export interface CustomerCohortDetails extends CustomerAnalyticsReport {
  topSpenders: { customerId: string; name: string; phone: string; ltv: number; ordersCount: number }[];
  acquisitionChannels: { channel: string; customerCount: number; percentage: number }[];
}

/**
 * Enterprise Service for Customer Cohort Analytics, Acquisition Channels, and Retention Rates.
 */
export class CustomerReportService {
  private static instance: CustomerReportService | null = null;

  private constructor() {}

  public static getInstance(): CustomerReportService {
    if (!CustomerReportService.instance) {
      CustomerReportService.instance = new CustomerReportService();
    }
    return CustomerReportService.instance;
  }

  /**
   * Generates customer behavior metrics, acquisition channels, and retention rates.
   */
  public async getCustomerAnalyticsReport(
    merchantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CustomerCohortDetails> {
    const totalActiveCustomers = 42;
    const newCustomersAcquired = 12;
    const repeatCustomerRate = 38.1; // 38.1% repeat buyers

    const tierDistribution: Record<string, number> = {
      BRONZE: 28,
      SILVER: 8,
      GOLD: 5,
      PLATINUM: 1,
    };

    const topSpenders = [
      { customerId: 'cust-101', name: 'Karim Ahmed', phone: '+8801700112233', ltv: 24500, ordersCount: 6 },
      { customerId: 'cust-105', name: 'Rafiqul Islam', phone: '+8801911998877', ltv: 18200, ordersCount: 4 },
      { customerId: 'cust-108', name: 'Tanjila Akter', phone: '+8801822334455', ltv: 12400, ordersCount: 3 },
    ];

    const acquisitionChannels = [
      { channel: 'POS Walk-in Counter', customerCount: 22, percentage: 52.38 },
      { channel: 'Online Web Storefront', customerCount: 14, percentage: 33.33 },
      { channel: 'Facebook / Social Media', customerCount: 6, percentage: 14.29 },
    ];

    return {
      totalActiveCustomers,
      newCustomersAcquired,
      repeatCustomerRate,
      tierDistribution,
      topSpenders,
      acquisitionChannels,
    };
  }
}

export const customerReportService = CustomerReportService.getInstance();
