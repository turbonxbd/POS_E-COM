import React from 'react';
import { Button } from '../ui/Button';

export interface SubscriptionBannerProps {
  planName: string;
  status: string;
  remainingDays: number;
  showWarning: boolean;
  warningMessage?: string;
  onRenewClick?: () => void;
  onUpgradeClick?: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  planName,
  status,
  remainingDays,
  showWarning,
  warningMessage,
  onRenewClick,
  onUpgradeClick,
}) => {
  if (!showWarning && status === 'ACTIVE' && remainingDays > 7) {
    return null; // Don't render banner if active with > 7 days remaining
  }

  const isTrial = status === 'TRIALING';

  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderRadius: 'var(--border-radius)',
        backgroundColor: isTrial ? 'rgba(37, 99, 235, 0.1)' : 'rgba(245, 158, 11, 0.15)',
        border: `1px solid ${isTrial ? 'var(--primary)' : '#f59e0b'}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{isTrial ? '⚡' : '⚠️'}</span>
        <div>
          <strong style={{ fontSize: '1rem', color: 'var(--foreground)' }}>
            {isTrial ? `Free Trial Active (${remainingDays} days left)` : warningMessage || `Subscription Expiration Warning`}
          </strong>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            Current Plan: <strong>{planName}</strong> • Enjoy unlimited multi-tenant feature access.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="primary" size="sm" onClick={onRenewClick}>
          {isTrial ? 'Choose Plan Now' : 'Renew Subscription'}
        </Button>
        <Button variant="outline" size="sm" onClick={onUpgradeClick}>
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
};
