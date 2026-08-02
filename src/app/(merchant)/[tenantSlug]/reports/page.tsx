'use client';

import React, { useState, useEffect } from 'react';
import {
  DateRangePreset,
  ExpenseCategoryDTO,
  MerchantExpenseDTO,
  ProfitLossReportData,
} from '../../../../types/reports.types';
import { financialReportService } from '../../../../features/reports/services/financial-report.service';
import { salesReportService } from '../../../../features/reports/services/sales-report.service';
import { inventoryReportService } from '../../../../features/reports/services/inventory-report.service';
import { expenseService } from '../../../../features/reports/services/expense.service';

import { DateRangePickerBar } from '../../../../components/reports/DateRangePickerBar';
import { KPIOverviewGrid } from '../../../../components/reports/KPIOverviewGrid';
import { SalesAndProfitChart } from '../../../../components/reports/SalesAndProfitChart';
import { PaymentBreakdownPieChart } from '../../../../components/reports/PaymentBreakdownPieChart';
import { ReportExportToolbar } from '../../../../components/reports/ReportExportToolbar';
import { AddExpenseModal } from '../../../../components/reports/AddExpenseModal';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export default function MerchantReportsPage() {
  const merchantId = 'merch-techstore';

  // Filter States
  const [preset, setPreset] = useState<DateRangePreset>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');

  // Tab State
  const [activeTab, setActiveTab] = useState<'pnl' | 'sales' | 'inventory' | 'expenses'>('pnl');

  // Data States
  const [pnlData, setPnlData] = useState<ProfitLossReportData>({
    periodLabel: 'Current Billing Period',
    totalSalesRevenue: 45800,
    costOfGoodsSold: 21500,
    grossProfit: 24300,
    grossProfitMargin: 53.06,
    totalOperationalExpenses: 28500,
    netProfit: -4200,
    netProfitMargin: -9.17,
    expensesByCategory: [
      { categoryName: 'Store Rent & Facilities', amount: 25000 },
      { categoryName: 'Utilities (Electricity, Water, Internet)', amount: 3500 },
    ],
  });

  const [salesMetrics, setSalesMetrics] = useState<any>(null);
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
  const [deadStock, setDeadStock] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<MerchantExpenseDTO[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryDTO[]>([]);

  // Export Loading States
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);

  // Load Reports Data
  const loadReportData = async () => {
    try {
      const pnl = await financialReportService.getProfitLossReport(merchantId, startDate, endDate);
      setPnlData(pnl);

      const sales = await salesReportService.getSalesReport(merchantId, startDate, endDate);
      setSalesMetrics(sales);

      const inv = await inventoryReportService.getInventoryValuationReport(merchantId);
      setInventoryValuation(inv);

      const dead = await inventoryReportService.getDeadStockReport(merchantId, 60);
      setDeadStock(dead);

      const expList = await expenseService.getExpenses(merchantId, startDate, endDate);
      setExpenses(expList);

      const cats = await expenseService.getExpenseCategories(merchantId);
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching analytics reports:', err);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [preset, startDate, endDate]);

  // Export Handlers
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const typeMap: Record<string, string> = {
      pnl: 'PROFIT_LOSS',
      sales: 'SALES',
      inventory: 'INVENTORY',
      expenses: 'PROFIT_LOSS',
    };
    const reportType = typeMap[activeTab] || 'PROFIT_LOSS';
    const url = `/api/merchant/reports/export/pdf?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
    setIsExportingPDF(false);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const typeMap: Record<string, string> = {
      pnl: 'PROFIT_LOSS',
      sales: 'SALES',
      inventory: 'INVENTORY',
      expenses: 'PROFIT_LOSS',
    };
    const reportType = typeMap[activeTab] || 'PROFIT_LOSS';
    const url = `/api/merchant/reports/export/excel?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
    setIsExportingExcel(false);
  };

  const handleAddExpense = async (payload: any) => {
    await expenseService.addExpense(merchantId, {
      ...payload,
      merchantId,
      createdBy: 'Manager Rahim',
    });
    await loadReportData();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-100 min-h-screen font-sans antialiased select-none">
      {/* Header & Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📈 Reports, P&L & Financial Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time profit & loss calculation, COGS margins, expense tracker, and multi-channel sales reports.
          </p>
        </div>

        <ReportExportToolbar
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          isExportingPDF={isExportingPDF}
          isExportingExcel={isExportingExcel}
        />
      </div>

      {/* Global Date Range Picker */}
      <DateRangePickerBar
        preset={preset}
        onPresetChange={setPreset}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

      {/* KPI Overview Grid */}
      <KPIOverviewGrid data={pnlData} />

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <SalesAndProfitChart />
        </div>
        <div>
          <PaymentBreakdownPieChart />
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 text-xs font-bold gap-2 bg-slate-50 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('pnl')}
            className={`py-3.5 px-3 transition-colors whitespace-nowrap ${
              activeTab === 'pnl' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📊 Profit & Loss (P&L) Statement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`py-3.5 px-3 transition-colors whitespace-nowrap ${
              activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🛒 Sales Analytics & Channels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 px-3 transition-colors whitespace-nowrap ${
              activeTab === 'inventory' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📦 Inventory Asset Valuation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 px-3 transition-colors whitespace-nowrap ${
              activeTab === 'expenses' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            💸 Expense Manager ({expenses.length})
          </button>
        </div>

        <div className="p-4 text-xs">
          {/* Tab 1: P&L Statement */}
          {activeTab === 'pnl' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Profit & Loss Statement ({pnlData.periodLabel})</h3>
              <table className="w-full border-collapse text-left border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-600 uppercase">
                    <th className="p-3">Financial Category / Account</th>
                    <th className="p-3 text-right">Amount (BDT)</th>
                    <th className="p-3 text-right">% Revenue Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Gross Sales Revenue (POS Counter + Online Store)</td>
                    <td className="p-3 text-right font-extrabold text-blue-600">৳{pnlData.totalSalesRevenue.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-700">100.00%</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-600 pl-6">Less: Cost of Goods Sold (COGS)</td>
                    <td className="p-3 text-right font-semibold text-rose-600">-৳{pnlData.costOfGoodsSold.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500">
                      {pnlData.totalSalesRevenue > 0 ? ((pnlData.costOfGoodsSold / pnlData.totalSalesRevenue) * 100).toFixed(2) : 0}%
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-extrabold text-emerald-900">
                    <td className="p-3">GROSS PROFIT</td>
                    <td className="p-3 text-right text-emerald-700">৳{pnlData.grossProfit.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-800">{pnlData.grossProfitMargin}%</td>
                  </tr>
                  {pnlData.expensesByCategory.map((exp, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-600 pl-6">Less: {exp.categoryName}</td>
                      <td className="p-3 text-right font-semibold text-amber-600">-৳{exp.amount.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-500">
                        {pnlData.totalSalesRevenue > 0 ? ((exp.amount / pnlData.totalSalesRevenue) * 100).toFixed(2) : 0}%
                      </td>
                    </tr>
                  ))}
                  <tr className={`font-extrabold text-sm ${pnlData.netProfit >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                    <td className="p-3">NET INCOME / PROFIT</td>
                    <td className="p-3 text-right">৳{pnlData.netProfit.toLocaleString()}</td>
                    <td className="p-3 text-right">{pnlData.netProfitMargin}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Sales Analytics */}
          {activeTab === 'sales' && salesMetrics && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Multi-Channel Sales Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-700">🛒 Web Storefront Orders</div>
                  <div className="text-xl font-extrabold text-blue-600">৳{salesMetrics.onlineSalesAmount.toLocaleString()}</div>
                </Card>

                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-700">🏬 POS Counter Walk-in Sales</div>
                  <div className="text-xl font-extrabold text-emerald-600">৳{salesMetrics.posSalesAmount.toLocaleString()}</div>
                </Card>
              </div>
            </div>
          )}

          {/* Tab 3: Inventory Valuation */}
          {activeTab === 'inventory' && inventoryValuation && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Inventory Valuation & Dead Stock Audit</h3>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-500">Asset Cost Value</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">৳{inventoryValuation.totalAssetValuationCost.toLocaleString()}</div>
                </Card>

                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-500">Expected Retail Value</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">৳{inventoryValuation.totalAssetValuationRetail.toLocaleString()}</div>
                </Card>

                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-500">Potential Gross Margin</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">{inventoryValuation.potentialProfitMargin}%</div>
                </Card>
              </div>

              {/* Dead Stock Items */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 mb-2">⚠️ Non-Moving / Dead Stock Items (&gt;60 Days Without Sale)</h4>
                <table className="w-full border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-600 uppercase font-bold border-b border-slate-200">
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-center">Stock Qty</th>
                      <th className="p-2 text-right">Cost Value</th>
                      <th className="p-2 text-center">Days Inactive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadStock.map((d, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-2 font-mono font-bold text-blue-600">{d.sku}</td>
                        <td className="p-2 font-semibold text-slate-900">{d.productName}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{d.stockQuantity}</td>
                        <td className="p-2 text-right text-rose-600 font-bold">৳{d.totalCostValue.toLocaleString()}</td>
                        <td className="p-2 text-center text-amber-700 font-extrabold">{d.daysWithoutSale} Days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Expense Manager */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Operational Expenses Feed</h3>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="text-xs font-bold py-2 px-4 bg-blue-600 text-white"
                >
                  ➕ Record New Expense
                </Button>
              </div>

              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="p-2.5 text-left">Title / Memo</th>
                    <th className="p-2.5 text-left">Category</th>
                    <th className="p-2.5 text-right">Amount (BDT)</th>
                    <th className="p-2.5 text-center">Payment Method</th>
                    <th className="p-2.5 text-left">Created By</th>
                    <th className="p-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No operational expenses recorded for selected date range.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{exp.title}</td>
                        <td className="p-2.5 text-slate-600">{exp.categoryName}</td>
                        <td className="p-2.5 text-right font-extrabold text-amber-600">৳{exp.amount.toLocaleString()}</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded">
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{exp.createdBy}</td>
                        <td className="p-2.5 text-right text-slate-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        categories={categories}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
}
