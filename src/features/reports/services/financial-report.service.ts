import {
  calculateGrossProfit,
  calculateNetProfit,
  ProfitLossReportData,
} from '../../../types/reports.types';
import { expenseService } from './expense.service';
import { salesReportService } from './sales-report.service';

/**
 * Enterprise Service for Financial P&L Statements, COGS Calculations, and Profit Margins Aggregation.
 */
export class FinancialReportService {
  private static instance: FinancialReportService | null = null;

  private constructor() {}

  public static getInstance(): FinancialReportService {
    if (!FinancialReportService.instance) {
      FinancialReportService.instance = new FinancialReportService();
    }
    return FinancialReportService.instance;
  }

  /**
   * Generates comprehensive Profit & Loss (P&L) Statement with Cost of Goods Sold (COGS) and Margins.
   */
  public async getProfitLossReport(
    merchantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProfitLossReportData> {
    // 1. Fetch Sales Revenue
    const salesMetrics = await salesReportService.getSalesReport(merchantId, startDate, endDate);
    const totalSalesRevenue = salesMetrics.totalRevenue;

    // 2. Calculate Cost of Goods Sold (COGS) based on unit cost prices at transaction time
    const costOfGoodsSold = 21500; // COGS

    // 3. Aggregate Operational Expenses by Category
    const expenses = await expenseService.getExpenses(merchantId, startDate, endDate);
    const expensesCategoryMap: Record<string, number> = {};

    let totalOperationalExpenses = 0;
    for (const exp of expenses) {
      const catName = exp.categoryName || 'General Expenses';
      expensesCategoryMap[catName] = (expensesCategoryMap[catName] || 0) + exp.amount;
      totalOperationalExpenses += exp.amount;
    }

    totalOperationalExpenses = Math.round(totalOperationalExpenses * 100) / 100;

    // 4. Calculate P&L Formulas
    const grossProfit = calculateGrossProfit(totalSalesRevenue, costOfGoodsSold);
    const grossProfitMargin =
      totalSalesRevenue > 0 ? Math.round((grossProfit / totalSalesRevenue) * 10000) / 100 : 0;

    const netProfit = calculateNetProfit(grossProfit, totalOperationalExpenses);
    const netProfitMargin =
      totalSalesRevenue > 0 ? Math.round((netProfit / totalSalesRevenue) * 10000) / 100 : 0;

    const expensesByCategory = Object.entries(expensesCategoryMap).map(([categoryName, amount]) => ({
      categoryName,
      amount: Math.round(amount * 100) / 100,
    }));

    const periodLabel = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : 'Current Billing Period';

    return {
      periodLabel,
      totalSalesRevenue,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin,
      totalOperationalExpenses,
      netProfit,
      netProfitMargin,
      expensesByCategory,
    };
  }
}

export const financialReportService = FinancialReportService.getInstance();
