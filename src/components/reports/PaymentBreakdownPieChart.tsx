import React from 'react';
import { PaymentMethodBreakdown } from '../../types/reports.types';
import { Card } from '../ui/Card';

export interface PaymentBreakdownPieChartProps {
  data?: PaymentMethodBreakdown;
}

export const PaymentBreakdownPieChart: React.FC<PaymentBreakdownPieChartProps> = ({
  data = {
    cashAmount: 18500,
    bKashAmount: 16200,
    nagadAmount: 5100,
    cardAmount: 3500,
    dueAmount: 2500,
  },
}) => {
  const total =
    data.cashAmount + data.bKashAmount + data.nagadAmount + data.cardAmount + data.dueAmount || 1;

  const items = [
    { label: '💵 Cash (POS)', amount: data.cashAmount, color: 'bg-emerald-500', hex: '#10b981' },
    { label: '📱 bKash Direct', amount: data.bKashAmount, color: 'bg-pink-500', hex: '#ec4899' },
    { label: '📲 Nagad Direct', amount: data.nagadAmount, color: 'bg-orange-500', hex: '#f97316' },
    { label: '💳 Cards / SSLCommerz', amount: data.cardAmount, color: 'bg-blue-500', hex: '#3b82f6' },
    { label: '⏳ Due / Credit', amount: data.dueAmount, color: 'bg-slate-400', hex: '#94a3b8' },
  ];

  return (
    <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 select-none">
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">🍩 Payment Collection Breakdown</h3>
        <p className="text-[11px] text-slate-500">Revenue split by payment gateways & cash</p>
      </div>

      {/* Payment Channel Items Feed */}
      <div className="space-y-2 pt-1 text-xs">
        {items.map((item, idx) => {
          const pct = Math.round((item.amount / total) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900 font-extrabold">
                  ৳{item.amount.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div style={{ width: `${pct}%` }} className={`h-full ${item.color} rounded-full transition-all`} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
