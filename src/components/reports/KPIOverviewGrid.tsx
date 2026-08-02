import React from 'react';
import { ProfitLossReportData } from '../../types/reports.types';
import { Card } from '../ui/Card';

export interface KPIOverviewGridProps {
  data: ProfitLossReportData;
}

export const KPIOverviewGrid: React.FC<KPIOverviewGridProps> = ({ data }) => {
  const isNetProfitable = data.netProfit >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 select-none">
      {/* Gross Sales Revenue */}
      <Card className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Gross Sales Revenue</div>
        <div className="text-xl font-extrabold text-blue-600 mt-1">
          ৳{data.totalSalesRevenue.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Online + POS Counter</div>
      </Card>

      {/* COGS */}
      <Card className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Cost of Goods Sold (COGS)</div>
        <div className="text-xl font-extrabold text-rose-600 mt-1">
          ৳{data.costOfGoodsSold.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Product Cost at Sale Time</div>
      </Card>

      {/* Gross Profit */}
      <Card className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Gross Profit</div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
            {data.grossProfitMargin}%
          </span>
        </div>
        <div className="text-xl font-extrabold text-emerald-600 mt-1">
          ৳{data.grossProfit.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Revenue - COGS</div>
      </Card>

      {/* Operational Expenses */}
      <Card className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Operational Expenses</div>
        <div className="text-xl font-extrabold text-amber-600 mt-1">
          ৳{data.totalOperationalExpenses.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Rent, Salaries, Marketing</div>
      </Card>

      {/* Net Profit */}
      <Card className={`p-3.5 border rounded-xl shadow-xs ${isNetProfitable ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Net Income / Profit</div>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isNetProfitable ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}`}>
            {data.netProfitMargin}%
          </span>
        </div>
        <div className={`text-xl font-extrabold mt-1 ${isNetProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
          ৳{data.netProfit.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Gross Profit - Expenses</div>
      </Card>
    </div>
  );
};
