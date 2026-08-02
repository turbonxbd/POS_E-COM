import React, { useState, useEffect } from 'react';
import {
  SubscriptionBanner,
  KPICards,
  SalesChart,
  RecentOrdersTable,
  LowStockWidget,
  NotificationCenter,
} from '../../../../components/merchant-dashboard';
import {
  DashboardKPIs,
  SalesChartPoint,
  RecentOrderSummary,
  LowStockItem,
  DashboardNotification,
  TimeframeType,
} from '../../../../types/merchant-dashboard.types';

export default function MerchantDashboardPage({ params }: { params: { tenantSlug: string } }) {
  const [timeframe, setTimeframe] = useState<TimeframeType>('THIS_MONTH');
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard Data States
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [subOverview, setSubOverview] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [statsRes, chartRes, ordersRes, stockRes, notifRes, subRes] = await Promise.all([
          fetch(`/api/merchant/dashboard/stats?timeframe=${timeframe}`),
          fetch(`/api/merchant/dashboard/sales-chart?timeframe=${timeframe}`),
          fetch('/api/merchant/dashboard/recent-orders?limit=5'),
          fetch('/api/merchant/dashboard/low-stock?threshold=10'),
          fetch('/api/merchant/dashboard/notifications'),
          fetch('/api/merchant/dashboard/subscription-status'),
        ]);

        const statsData = await statsRes.json();
        const chartData = await chartRes.json();
        const ordersData = await ordersRes.json();
        const stockData = await stockRes.json();
        const notifData = await notifRes.json();
        const subData = await subRes.json();

        if (statsData.success) setKpis(statsData.data);
        if (chartData.success) setSalesChart(chartData.data);
        if (ordersData.success) setRecentOrders(ordersData.data);
        if (stockData.success) setLowStockItems(stockData.data);
        if (notifData.success) setNotifications(notifData.data);
        if (subData.success) setSubOverview(subData.data);
      } catch (err) {
        console.error('Failed to load merchant dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [timeframe]);

  return (
    <div className="ag-merchant-dashboard-container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Bar with Store Title & Notification Center */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
            Store Overview & Analytics
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Tenant Slug: <strong>{params.tenantSlug}</strong> • Live Multi-channel Insights
          </p>
        </div>

        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={(id) => {
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
          }}
          onClearAll={() => setNotifications([])}
        />
      </header>

      {/* Subscription Expiration / Renewal Warning Banner */}
      {subOverview && (
        <SubscriptionBanner
          planName={subOverview.planName}
          status={subOverview.status}
          remainingDays={subOverview.remainingDays}
          showWarning={subOverview.showRenewalWarningBanner}
          warningMessage={subOverview.renewalWarningMessage}
          onRenewClick={() => (window.location.href = '/subscription/renew')}
          onUpgradeClick={() => (window.location.href = '/pricing')}
        />
      )}

      {/* Overview KPI Cards */}
      {kpis && <KPICards kpis={kpis} isLoading={isLoading} />}

      {/* Main Content Grid: Sales Chart (Left 8 cols) & Low Stock Widget (Right 4 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ flex: 2 }}>
          <SalesChart
            data={salesChart}
            selectedTimeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
            isLoading={isLoading}
          />
        </div>

        <div style={{ flex: 1 }}>
          <LowStockWidget
            items={lowStockItems}
            isLoading={isLoading}
            onRestockClick={(id) => alert(`Opening restock drawer for product ID: ${id}`)}
          />
        </div>
      </div>

      {/* Recent Orders Feed Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <RecentOrdersTable
          orders={recentOrders}
          isLoading={isLoading}
          onViewOrderDetails={(id) => alert(`Opening order modal for Order ID: ${id}`)}
        />
      </div>
    </div>
  );
}
