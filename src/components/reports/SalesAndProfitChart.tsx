import React from 'react';
import { Card } from '../ui/Card';

export interface ChartDataPoint {
  label: string; // e.g. "Mon", "Tue", "Wed" or "Jan", "Feb"
  revenue: number;
  netProfit: number;
}

export interface SalesAndProfitChartProps {
  dataPoints?: ChartDataPoint[];
}

export const SalesAndProfitChart: React.FC<SalesAndProfitChartProps> = ({
  dataPoints = [
    { label: 'Mon', revenue: 5800, netProfit: 2100 },
    { label: 'Tue', revenue: 7200, netProfit: 3100 },
    { label: 'Wed', revenue: 4900, netProfit: 1800 },
    { label: 'Thu', revenue: 8500, netProfit: 3900 },
    { label: 'Fri', revenue: 9400, netProfit: 4200 },
    { label: 'Sat', revenue: 11200, netProfit: 5400 },
    { label: 'Sun', revenue: 6800, netProfit: 2900 },
  ],
}) => {
  const maxVal = Math.max(...dataPoints.map((d) => Math.max(d.revenue, d.netProfit))) || 10000;

  return (
    <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">📊 Sales Revenue vs. Net Profit Trend</h3>
          <p className="text-[11px] text-slate-500">Daily performance comparison in BDT (৳)</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="text-slate-700">Gross Sales Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-700">Net Profit</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="h-44 w-full pt-2 flex items-end justify-between gap-2 border-b border-slate-200 pb-2">
        {dataPoints.map((dp, idx) => {
          const revHeightPct = Math.round((dp.revenue / maxVal) * 100);
          const profitHeightPct = Math.round((dp.netProfit / maxVal) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip Hover */}
              <div className="absolute -top-12 bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                <div>Rev: ৳{dp.revenue.toLocaleString()}</div>
                <div>Profit: ৳{dp.netProfit.toLocaleString()}</div>
              </div>

              {/* Bars Pair */}
              <div className="flex items-end gap-1 w-full justify-center h-full">
                <div
                  style={{ height: `${revHeightPct}%` }}
                  className="w-1/2 max-w-[20px] bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                />
                <div
                  style={{ height: `${profitHeightPct}%` }}
                  className="w-1/2 max-w-[20px] bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                />
              </div>

              {/* Label */}
              <span className="text-[10px] font-bold text-slate-500 mt-1">{dp.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
