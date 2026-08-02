'use client';

import React, { useState, useEffect } from 'react';
import {
  CourierProviderType,
  OrderSourceType,
  OrderStatusUpdateDTO,
  UnifiedOrderDTO,
  UnifiedOrderStatusType,
} from '../../../../types/order-management.types';
import { orderLifecycleService } from '../../../../features/order-management/services/order-lifecycle.service';
import { courierDispatchService } from '../../../../features/order-management/services/courier-dispatch.service';
import { generateOrderInvoiceHTML, generatePackingSlipHTML } from '../../../../lib/invoice-pdf';

import { OrderListTable } from '../../../../components/order-management/OrderListTable';
import { OrderDetailsDrawer } from '../../../../components/order-management/OrderDetailsDrawer';
import { TrackingModal } from '../../../../components/order-management/TrackingModal';
import { Card } from '../../../../components/ui/Card';

export default function MerchantOrdersPage() {
  const merchantId = 'merch-techstore';

  // Data States
  const [orders, setOrders] = useState<UnifiedOrderDTO[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filter States
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<OrderSourceType | 'ALL'>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string | 'ALL'>('ALL');

  // Modal / Drawer States
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrderDTO | null>(null);
  const [historyLogs, setHistoryLogs] = useState<OrderStatusUpdateDTO[]>([]);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState<boolean>(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);

  // Load Orders Data
  const loadOrders = async () => {
    try {
      const filters: any = {};
      if (activeTab !== 'ALL' && activeTab !== 'ONLINE' && activeTab !== 'POS') {
        filters.status = activeTab as UnifiedOrderStatusType;
      }
      if (activeTab === 'ONLINE') filters.source = 'ONLINE';
      if (activeTab === 'POS') filters.source = 'POS';
      if (selectedSource !== 'ALL') filters.source = selectedSource;
      if (searchQuery) filters.searchQuery = searchQuery;

      const res = await orderLifecycleService.getOrders(merchantId, filters);
      setOrders(res.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab, searchQuery, selectedSource, selectedPaymentStatus]);

  // Handlers
  const handleSelectOrderToggle = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleViewOrderDetails = async (order: UnifiedOrderDTO) => {
    setSelectedOrder(order);
    const logs = await orderLifecycleService.getOrderStatusHistory(merchantId, order.id);
    setHistoryLogs(logs);
    setIsDetailsDrawerOpen(true);
  };

  const handleTrackOrder = (order: UnifiedOrderDTO) => {
    setSelectedOrder(order);
    setIsTrackingModalOpen(true);
  };

  const handlePrintSingleInvoice = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const html = generateOrderInvoiceHTML(ord);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleBulkStatusChange = async (newStatus: UnifiedOrderStatusType) => {
    if (selectedOrderIds.length === 0) return;
    try {
      for (const id of selectedOrderIds) {
        await orderLifecycleService.updateOrderStatus(merchantId, id, newStatus, 'MERCHANT_ADMIN', 'Bulk status update');
      }
      alert(`Updated status to ${newStatus} for ${selectedOrderIds.length} orders.`);
      setSelectedOrderIds([]);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Bulk status change failed.');
    }
  };

  const handleBulkDispatch = async (provider: CourierProviderType) => {
    if (selectedOrderIds.length === 0) return;
    try {
      const res = await courierDispatchService.dispatchToCourier(selectedOrderIds, provider, merchantId);
      alert(res.message);
      setSelectedOrderIds([]);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Bulk dispatch failed.');
    }
  };

  const handleBulkPrintInvoices = (type: 'invoice' | 'packing_slip') => {
    if (selectedOrderIds.length === 0) return;
    const selectedOrdersList = orders.filter((o) => selectedOrderIds.includes(o.id));
    const html =
      type === 'packing_slip'
        ? generatePackingSlipHTML(selectedOrdersList)
        : selectedOrdersList.map((o) => generateOrderInvoiceHTML(o)).join('\n<div style="page-break-after: always;"></div>\n');

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Metrics Stats
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter((o) => o.currentStatus === 'PENDING' || o.currentStatus === 'PROCESSING').length;
  const inTransitCount = orders.filter((o) => o.currentStatus === 'SHIPPED').length;
  const returnedCount = orders.filter((o) => o.currentStatus === 'RETURNED').length;

  return (
    <div className="p-6 space-y-6 bg-slate-100 min-h-screen font-sans antialiased select-none">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📦 Order Management Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-channel orders (Online & POS), bulk dispatch to Steadfast/Pathao, and print invoices.
          </p>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-slate-500">Total Active Orders</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrdersCount}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-amber-600">Pending Fulfillment</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-blue-600">In-Transit Shipments</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{inTransitCount}</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-red-600">Returned / Cancelled</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{returnedCount}</div>
        </Card>
      </div>

      {/* Order List Table Component */}
      <OrderListTable
        orders={orders}
        selectedOrderIds={selectedOrderIds}
        onSelectOrderToggle={handleSelectOrderToggle}
        onSelectAllToggle={handleSelectAllToggle}
        onViewOrderDetails={handleViewOrderDetails}
        onTrackOrder={handleTrackOrder}
        onPrintInvoice={handlePrintSingleInvoice}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDispatch={handleBulkDispatch}
        onBulkPrintInvoices={handleBulkPrintInvoices}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        selectedPaymentStatus={selectedPaymentStatus}
        onPaymentStatusChange={setSelectedPaymentStatus}
      />

      {/* Slide-over Order Details & Courier Dispatch Drawer */}
      <OrderDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        order={selectedOrder}
        historyLogs={historyLogs}
        onUpdateStatus={async (newStatus, note) => {
          if (!selectedOrder) return;
          await orderLifecycleService.updateOrderStatus(merchantId, selectedOrder.id, newStatus, 'MERCHANT_ADMIN', note);
          await loadOrders();
          setIsDetailsDrawerOpen(false);
        }}
        onDispatchCourier={async (provider, weight, instruction) => {
          if (!selectedOrder) return;
          await courierDispatchService.dispatchToCourier([selectedOrder.id], provider, merchantId);
          await loadOrders();
          setIsDetailsDrawerOpen(false);
        }}
        onPrintInvoice={handlePrintSingleInvoice}
      />

      {/* Live Courier Shipment Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
