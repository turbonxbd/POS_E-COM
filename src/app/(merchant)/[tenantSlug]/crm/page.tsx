'use client';

import React, { useState, useEffect } from 'react';
import {
  CRMCustomerSummary,
  CustomerNoteDTO,
  DEFAULT_LOYALTY_CONFIG,
  LoyaltyConfig,
  MembershipTierType,
  RewardTransactionDTO,
} from '../../../../types/customer-crm.types';
import { crmCustomerService } from '../../../../features/customer-crm/services/crm-customer.service';
import { rewardService } from '../../../../features/customer-crm/services/reward.service';
import { customerNotesService } from '../../../../features/customer-crm/services/customer-notes.service';
import { CRMExporter } from '../../../../features/customer-crm/utils/crm-exporter';

import { CustomerTable } from '../../../../components/customer-crm/CustomerTable';
import { CustomerProfileDrawer } from '../../../../components/customer-crm/CustomerProfileDrawer';
import { LoyaltyConfigModal } from '../../../../components/customer-crm/LoyaltyConfigModal';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export default function MerchantCRMPage() {
  const merchantId = 'merch-techstore';

  // Data States
  const [customers, setCustomers] = useState<CRMCustomerSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filter States
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<MembershipTierType | 'ALL'>('ALL');

  // Modal / Drawer States
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomerSummary | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardTransactionDTO[]>([]);
  const [notes, setNotes] = useState<CustomerNoteDTO[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState<boolean>(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);

  // Load CRM Customers
  const loadCustomers = async () => {
    try {
      const filters: any = {};
      if (activeTab !== 'ALL') filters.tag = activeTab;
      if (selectedTier !== 'ALL') filters.membershipTier = selectedTier;
      if (searchQuery) filters.searchQuery = searchQuery;

      const res = await crmCustomerService.queryCustomers(merchantId, filters);
      setCustomers(res.customers);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error fetching CRM customer directory:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeTab, searchQuery, selectedTier]);

  // Handlers
  const handleView360Profile = async (customer: CRMCustomerSummary) => {
    setSelectedCustomer(customer);
    const details = await crmCustomerService.getCustomer360Details(merchantId, customer.id);

    if (details) {
      setRewardHistory(details.rewardHistory);
      setNotes(details.notes);
      setOrderHistory(details.orderHistory);
    }
    setIsProfileDrawerOpen(true);
  };

  const handleAdjustPoints = async (customer: CRMCustomerSummary) => {
    const ptsInput = prompt(`Enter reward points to credit/redeem for ${customer.name} (Use negative number to redeem):`, '100');
    if (!ptsInput) return;

    const points = Number(ptsInput);
    if (isNaN(points) || points === 0) return;

    try {
      if (points < 0) {
        await rewardService.redeemRewardPoints(merchantId, customer.id, Math.abs(points));
      } else {
        await rewardService.addRewardPoints(merchantId, customer.id, points, 'MANUAL_ADJUSTMENT', 'Staff adjustment');
      }
      alert('Reward points balance updated successfully!');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Points adjustment failed.');
    }
  };

  const handleExportCSV = () => {
    const csvContent = CRMExporter.exportCustomersToCSV(customers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNote = async (noteText: string, isImportant: boolean) => {
    if (!selectedCustomer) return;
    await customerNotesService.addNote(merchantId, selectedCustomer.id, 'Manager Rahim', noteText, isImportant);
    const updatedNotes = await customerNotesService.getCustomerNotes(merchantId, selectedCustomer.id);
    setNotes(updatedNotes);
  };

  // Metric Stats Calculations
  const vipCount = customers.filter((c) => c.profile.tags.includes('VIP')).length;
  const avgLTV = customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + c.profile.lifetimeValue, 0) / customers.length) : 0;
  const totalRewardPoints = customers.reduce((acc, c) => acc + c.profile.rewardPoints, 0);

  return (
    <div className="p-6 space-y-6 bg-slate-100 min-h-screen font-sans antialiased select-none">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">👥 Customer CRM & Loyalty Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer lifetime value (LTV), RFM auto-segmentation, reward points balance, and 360-degree profiles.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsLoyaltyModalOpen(true)}
          className="text-xs font-bold py-2.5 px-4 bg-white border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center gap-2 shadow-xs"
        >
          <span>⚙️ Loyalty Rules Config</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-slate-500">Total CRM Profiles</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-amber-600">VIP High-Spenders</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{vipCount}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-emerald-600">Average Lifetime Value (LTV)</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">৳{avgLTV.toLocaleString()}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-blue-600">Active Reward Points Issued</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{totalRewardPoints.toLocaleString()} Pts</div>
        </Card>
      </div>

      {/* Customer Directory Table Component */}
      <CustomerTable
        customers={customers}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTier={selectedTier}
        onTierChange={setSelectedTier}
        onView360Profile={handleView360Profile}
        onExportCSV={handleExportCSV}
        onAdjustPoints={handleAdjustPoints}
      />

      {/* Slide-over Customer 360-Degree Profile Drawer */}
      <CustomerProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        customer={selectedCustomer}
        rewardHistory={rewardHistory}
        notes={notes}
        orderHistory={orderHistory}
        onAddNote={handleAddNote}
      />

      {/* Loyalty Program Configurator Modal */}
      <LoyaltyConfigModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        config={loyaltyConfig}
        onSaveConfig={async (cfg) => {
          setLoyaltyConfig(cfg);
        }}
      />
    </div>
  );
}
