import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DashboardKPIs } from '../../types/merchant-dashboard.types';

export interface KPICardsProps {
  kpis: DashboardKPIs;
  isLoading?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, isLoading }) => {
  const cards = [
    {
      title: 'Total Sales',
      metric: kpis.totalSales,
      icon: '💰',
      sub: 'vs. previous period',
    },
    {
      title: 'Total Revenue',
      metric: kpis.totalRevenue,
      icon: '📈',
      sub: 'vs. previous period',
    },
    {
      title: 'Total Orders',
      metric: kpis.totalOrders,
      icon: '🛍️',
      sub: 'vs. previous period',
    },
    {
      title: 'Active Customers',
      metric: kpis.activeCustomers,
      icon: '👥',
      sub: 'vs. previous period',
    },
  ];

  return (
    <div className="ag-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
      {cards.map((card, idx) => {
        const isUp = card.metric.growthPercentage >= 0;

        return (
          <Card key={idx} style={{ padding: '0.25rem' }}>
            <CardHeader style={{ paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
                  {card.title}
                </span>
                <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
              </div>
            </CardHeader>

            <CardContent>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                {isLoading ? '...' : card.metric.formattedValue}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <span
                  className={`ag-badge ${isUp ? 'ag-badge-success' : 'ag-badge-danger'}`}
                  style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}
                >
                  {isUp ? '↑ +' : '↓ '}{card.metric.growthPercentage}%
                </span>
                <span style={{ color: 'var(--muted-foreground)' }}>{card.sub}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
