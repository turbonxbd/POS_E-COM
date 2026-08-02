import React from 'react';
import { CRMCustomerSummary, MembershipTierType } from '../../types/customer-crm.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface CustomerTableProps {
  customers: CRMCustomerSummary[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTier: MembershipTierType | 'ALL';
  onTierChange: (tier: MembershipTierType | 'ALL') => void;
  onView360Profile: (customer: CRMCustomerSummary) => void;
  onExportCSV: () => void;
  onAdjustPoints: (customer: CRMCustomerSummary) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  onView360Profile,
  onExportCSV,
  onAdjustPoints,
}) => {
  const tabs = [
    { id: 'ALL', label: 'All Customers' },
    { id: 'VIP', label: '👑 VIP Members' },
    { id: 'At-Risk', label: '⚠️ At-Risk / Inactive' },
    { id: 'New-Buyer', label: '🌱 New Buyers' },
    { id: 'Bargain-Hunter', label: '🏷️ Bargain Hunters' },
  ];

  const getTierBadge = (tier: MembershipTierType) => {
    switch (tier) {
      case 'PLATINUM':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">💎 PLATINUM</span>;
      case 'GOLD':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">🥇 GOLD</span>;
      case 'SILVER':
        return <span className="bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">🥈 SILVER</span>;
      case 'BRONZE':
      default:
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">🥉 BRONZE</span>;
    }
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* Segment Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-3 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls & Exporter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search customer name, phone, email..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-9 text-xs font-medium"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Membership Tier Dropdown */}
          <select
            value={selectedTier}
            onChange={(e) => onTierChange(e.target.value as MembershipTierType | 'ALL')}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-slate-50"
          >
            <option value="ALL">All Membership Tiers</option>
            <option value="PLATINUM">Platinum Tier (৳50,000+)</option>
            <option value="GOLD">Gold Tier (৳20,000+)</option>
            <option value="SILVER">Silver Tier (৳5,000+)</option>
            <option value="BRONZE">Bronze Tier (৳0+)</option>
          </select>
        </div>

        {/* Export CSV Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={onExportCSV}
          className="text-xs font-bold py-2 px-4 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
        >
          <span>📥 Export CSV</span>
        </Button>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <th className="p-3">Customer Contact</th>
              <th className="p-3">Membership Tier</th>
              <th className="p-3 text-right">Lifetime Value (LTV)</th>
              <th className="p-3 text-center">Total Orders</th>
              <th className="p-3 text-right">AOV</th>
              <th className="p-3 text-center">Reward Points</th>
              <th className="p-3">Behavioral Tags</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No customer CRM records found matching current segment & filters.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                    {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                  </td>

                  <td className="p-3">{getTierBadge(c.profile.membershipTier)}</td>

                  <td className="p-3 text-right font-extrabold text-emerald-600">
                    ৳{c.profile.lifetimeValue.toLocaleString()}
                  </td>

                  <td className="p-3 text-center font-bold text-slate-800">
                    {c.profile.totalOrdersCount}
                  </td>

                  <td className="p-3 text-right text-slate-700 font-semibold">
                    ৳{c.profile.averageOrderValue.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span className="bg-blue-50 text-blue-700 font-extrabold text-xs px-2 py-0.5 rounded-full border border-blue-200">
                      {c.profile.rewardPoints} Pts
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.profile.tags.map((t) => (
                        <span
                          key={t}
                          className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onView360Profile(c)}
                      className="text-[11px] py-1 px-2.5 text-blue-600 border-blue-200"
                    >
                      👤 360 Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onAdjustPoints(c)}
                      className="text-[11px] py-1 px-2 text-slate-700"
                    >
                      🎁 Points
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
