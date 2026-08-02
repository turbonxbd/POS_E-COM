import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';

export interface UsageMetric {
  label: string;
  used: number;
  max: number | string;
  unit?: string;
}

export interface CurrentPlanCardProps {
  planName: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  renewalDate: string;
  monthlyPrice: number;
  metrics: UsageMetric[];
  onUpgradeClick?: () => void;
  onCancelClick?: () => void;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  planName,
  status,
  billingCycle,
  renewalDate,
  monthlyPrice,
  metrics,
  onUpgradeClick,
  onCancelClick,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return <span className="ag-badge ag-badge-success">● ACTIVE</span>;
      case 'TRIALING':
        return <span className="ag-badge ag-badge-info">⚡ 14-DAY TRIAL</span>;
      case 'PAST_DUE':
        return <span className="ag-badge ag-badge-warning">⚠️ PAST DUE (GRACE PERIOD)</span>;
      case 'EXPIRED':
        return <span className="ag-badge ag-badge-danger">🔒 EXPIRED (READ-ONLY)</span>;
      case 'CANCELLED':
        return <span className="ag-badge ag-badge-outline">CANCELLED</span>;
      default:
        return <span className="ag-badge ag-badge-outline">{status}</span>;
    }
  };

  return (
    <Card className="ag-current-plan-card">
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {getStatusBadge()}
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            Renews: <strong>{new Date(renewalDate).toLocaleDateString()}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <CardTitle style={{ fontSize: '1.5rem', margin: 0 }}>{planName}</CardTitle>
            <CardDescription style={{ fontSize: '0.875rem' }}>Billed {billingCycle.toLowerCase()}</CardDescription>
          </div>
          <div>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>${monthlyPrice}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>/mo</span>
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--foreground)' }}>
          Resource Usage & Quotas
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {metrics.map((m, idx) => {
            const isUnlimited = typeof m.max === 'string' && m.max.toLowerCase() === 'unlimited';
            const maxVal = typeof m.max === 'number' ? m.max : 1000;
            const percentage = isUnlimited ? 15 : Math.min(100, Math.round((m.used / maxVal) * 100));

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{m.label}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>
                    {m.used} / {m.max} {m.unit || ''}
                  </span>
                </div>
                <div
                  style={{
                    height: '0.5rem',
                    width: '100%',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: percentage > 85 ? '#ef4444' : 'var(--primary)',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter style={{ gap: '0.75rem', backgroundColor: 'transparent', borderTop: '1px solid var(--border)' }}>
        <Button variant="primary" size="md" onClick={onUpgradeClick} style={{ flex: 1 }}>
          ⚡ Upgrade / Change Plan
        </Button>
        {onCancelClick && status !== 'CANCELLED' && (
          <Button variant="outline" size="md" onClick={onCancelClick}>
            Cancel Subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
