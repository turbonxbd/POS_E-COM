export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type ExpensePaymentMethodType = 'CASH' | 'BANK' | 'MOBILE_BANKING';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseCategoryDTO {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MerchantExpenseDTO {
  id: string;
  merchantId: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  amount: number; // in BDT
  expenseDate: string;
  paymentMethod: ExpensePaymentMethodType;
  referenceNo?: string | null;
  note?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface SalesReportMetrics {
  totalRevenue: number;
  totalOrdersCount: number;
  posSalesAmount: number;
  onlineSalesAmount: number;
  averageOrderValue: number;
  totalDiscountsGiven: number;
  topSellingCategories: { categoryName: string; revenue: number; quantity: number }[];
}

export interface ProfitLossReportData {
  periodLabel: string;
  totalSalesRevenue: number;
  costOfGoodsSold: number; // COGS
  grossProfit: number; // totalSalesRevenue - costOfGoodsSold
  grossProfitMargin: number; // (grossProfit / totalSalesRevenue) * 100
  totalOperationalExpenses: number;
  netProfit: number; // grossProfit - totalOperationalExpenses
  netProfitMargin: number; // (netProfit / totalSalesRevenue) * 100
  expensesByCategory: { categoryName: string; amount: number }[];
}

export interface InventoryValuationReport {
  totalSKUCount: number;
  totalStockUnits: number;
  totalAssetValuationCost: number; // Sum(Qty * CostPrice)
  totalAssetValuationRetail: number; // Sum(Qty * SellingPrice)
  potentialProfitMargin: number;
  lowStockVariantsCount: number;
}

export interface CustomerAnalyticsReport {
  totalActiveCustomers: number;
  newCustomersAcquired: number;
  repeatCustomerRate: number; // Percentage
  tierDistribution: Record<string, number>;
}

export interface PaymentMethodBreakdown {
  cashAmount: number;
  bKashAmount: number;
  nagadAmount: number;
  cardAmount: number;
  dueAmount: number;
}

/**
 * Standard Financial Report Calculation Helpers
 */
export function calculateGrossProfit(totalSalesRevenue: number, costOfGoodsSold: number): number {
  return Math.round((totalSalesRevenue - costOfGoodsSold) * 100) / 100;
}

export function calculateNetProfit(grossProfit: number, totalOperationalExpenses: number): number {
  return Math.round((grossProfit - totalOperationalExpenses) * 100) / 100;
}

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Store Rent & Facilities',
  'Utilities (Electricity, Water, Internet)',
  'Staff Salaries & Payroll',
  'Logistics & Courier Delivery',
  'Marketing & Facebook Ads',
  'Office Supplies & Stationeries',
  'Software & Subscription Fees',
  'Miscellaneous & Maintenance',
];
