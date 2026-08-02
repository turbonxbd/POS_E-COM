import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { couponService } from '../../features/subscription/services/coupon.service';
import { BillingCycle, CouponValidationResult } from '../../types/subscription.types';

export interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  onConfirmPlanChange: (planId: string, billingCycle: BillingCycle, couponCode?: string) => Promise<void>;
}

const AVAILABLE_PLANS = [
  { id: 'plan-starter', name: 'Starter Plan', monthly: 19, yearlyMonthly: 15, features: ['100 Products', '500 Orders/mo', 'POS Counter'] },
  { id: 'plan-pro', name: 'Professional Plan', popular: true, monthly: 49, yearlyMonthly: 39, features: ['1,000 Products', '5,000 Orders/mo', 'Custom Domain', 'API Access'] },
  { id: 'plan-enterprise', name: 'Enterprise Plan', monthly: 199, yearlyMonthly: 159, features: ['Unlimited Products', 'Unlimited Orders', '24/7 Priority Support'] },
];

export const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  onConfirmPlanChange,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('YEARLY');
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const plan = AVAILABLE_PLANS.find((p) => p.id === selectedPlanId) || AVAILABLE_PLANS[1];
    const basePrice = billingCycle === 'YEARLY' ? plan.yearlyMonthly * 12 : plan.monthly;
    const result = await couponService.validateAndCalculateDiscount(couponCode, basePrice);
    setCouponResult(result);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirmPlanChange(selectedPlanId, billingCycle, couponResult?.valid ? couponCode : undefined);
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select or Upgrade Subscription Plan">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Billing Cycle Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', backgroundColor: 'var(--muted)', padding: '0.5rem', borderRadius: '9999px' }}>
          <button
            type="button"
            className={`ag-btn ag-btn-sm ${billingCycle === 'MONTHLY' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
            onClick={() => {
              setBillingCycle('MONTHLY');
              setCouponResult(null);
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`ag-btn ag-btn-sm ${billingCycle === 'YEARLY' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
            onClick={() => {
              setBillingCycle('YEARLY');
              setCouponResult(null);
            }}
          >
            Yearly Billing (Save 20%)
          </button>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {AVAILABLE_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlanId === plan.id;
            const price = billingCycle === 'YEARLY' ? plan.yearlyMonthly : plan.monthly;

            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setCouponResult(null);
                }}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--border-radius)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{plan.name}</strong>
                    {isCurrent && <span className="ag-badge ag-badge-info">CURRENT</span>}
                    {plan.popular && <span className="ag-badge ag-badge-success">POPULAR</span>}
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    {plan.features.join(' • ')}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.25rem' }}>${price}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>/mo</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Promo Coupon Section */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Enter Promo Coupon (e.g. WELCOME20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="md" onClick={handleApplyCoupon}>
            Apply
          </Button>
        </div>

        {couponResult && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--border-radius)',
              backgroundColor: couponResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: couponResult.valid ? '#10b981' : '#ef4444',
              fontSize: '0.875rem',
            }}
          >
            {couponResult.valid ? (
              <>
                ✓ Promo code <strong>{couponResult.code}</strong> applied! You save ${couponResult.discountAmount}. Final price: ${couponResult.finalPrice}.
              </>
            ) : (
              <>⚠️ {couponResult.error}</>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="outline" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" size="md" isLoading={isLoading} onClick={handleConfirm} style={{ flex: 2 }}>
            Confirm Plan Change
          </Button>
        </div>
      </div>
    </Modal>
  );
};
