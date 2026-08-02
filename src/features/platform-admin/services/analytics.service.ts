import { Merchant, PlatformRevenue, PlatformMetricsSummary } from '../../../types/platform-admin.types';

export interface DetailedAnalyticsOverview {
  metrics: PlatformMetricsSummary;
  growth: {
    merchantSignupMoMGrowthPercent: number;
    revenueMoMGrowthPercent: number;
  };
  merchantStatusBreakdown: {
    active: number;
    suspended: number;
    pending: number;
    cancelled: number;
    total: number;
  };
  mrr: number;
  arr: number;
  recentTransactions: PlatformRevenue[];
}

/**
 * Enterprise Service for Platform Analytics, MRR/ARR Calculations, and Growth Metrics.
 */
export class AnalyticsService {
  private static instance: AnalyticsService | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Calculates overall platform metrics summary, MRR, ARR, and MoM growth rates.
   */
  public async getMetricsOverview(
    merchants: Merchant[] = [],
    revenues: PlatformRevenue[] = []
  ): Promise<DetailedAnalyticsOverview> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Calculate Merchant Status Counts
    const active = merchants.filter((m) => m.status === 'ACTIVE').length;
    const suspended = merchants.filter((m) => m.status === 'SUSPENDED').length;
    const pending = merchants.filter((m) => m.status === 'PENDING').length;
    const cancelled = merchants.filter((m) => m.status === 'CANCELLED').length;
    const totalMerchants = merchants.length;

    // 2. Monthly Signups (Current vs Previous Month)
    const currentMonthSignups = merchants.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    const prevMonthSignups = merchants.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
    }).length;

    const merchantSignupMoMGrowthPercent =
      prevMonthSignups > 0
        ? Number((((currentMonthSignups - prevMonthSignups) / prevMonthSignups) * 100).toFixed(2))
        : currentMonthSignups > 0
        ? 100
        : 0;

    // 3. Revenue & MRR / ARR Calculations
    const successfulRevenues = revenues.filter((r) => r.status === 'SUCCESS');

    const currentMonthRevenue = successfulRevenues
      .filter((r) => {
        const d = new Date(r.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const prevMonthRevenue = successfulRevenues
      .filter((r) => {
        const d = new Date(r.createdAt);
        return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const revenueMoMGrowthPercent =
      prevMonthRevenue > 0
        ? Number((((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(2))
        : currentMonthRevenue > 0
        ? 100
        : 0;

    const mrr = currentMonthRevenue;
    const arr = mrr * 12;
    const totalAnnualRevenue = successfulRevenues.reduce((sum, r) => sum + r.amount, 0);

    // 4. Extract Recent Transactions
    const recentTransactions = [...revenues]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const metricsSummary: PlatformMetricsSummary = {
      totalMerchants,
      activeMerchants: active,
      suspendedMerchants: suspended,
      pendingMerchants: pending,
      totalMonthlyRevenue: mrr,
      totalAnnualRevenue,
      newSignupsThisMonth: currentMonthSignups,
      activePlansCount: 0,
    };

    return {
      metrics: metricsSummary,
      growth: {
        merchantSignupMoMGrowthPercent,
        revenueMoMGrowthPercent,
      },
      merchantStatusBreakdown: {
        active,
        suspended,
        pending,
        cancelled,
        total: totalMerchants,
      },
      mrr,
      arr,
      recentTransactions,
    };
  }
}

export const analyticsService = AnalyticsService.getInstance();
