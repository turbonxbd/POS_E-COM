import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ProductDTO, AdjustmentTypeEnum, AdjustmentReasonEnum } from '../../types/inventory.types';

export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDTO | null;
  onAdjustmentSubmit: (payload: {
    warehouseId: string;
    variantId: string;
    adjustmentType: AdjustmentTypeEnum;
    quantity: number;
    reason: AdjustmentReasonEnum;
    notes?: string;
  }) => Promise<boolean>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjustmentSubmit,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentTypeEnum>('ADD');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<AdjustmentReasonEnum>('CORRECT_COUNT');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!product) return null;

  const variant = product.variants?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (quantity <= 0 && adjustmentType !== 'SET') {
      setErrorMessage('Adjustment quantity must be greater than 0.');
      return;
    }

    if (!variant) {
      setErrorMessage('No product variant selected.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onAdjustmentSubmit({
        warehouseId: 'wh-main',
        variantId: variant.id,
        adjustmentType,
        quantity,
        reason,
        notes,
      });

      setIsLoading(false);
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Failed to apply stock adjustment.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${product.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
          SKU: <strong>{variant?.sku}</strong> • Warehouse: <strong>Dhaka Central Warehouse (WH-DAC-01)</strong>
        </p>

        {errorMessage && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
              Adjustment Operation
            </label>
            <select
              className="ag-input"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as AdjustmentTypeEnum)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)' }}
            >
              <option value="ADD">➕ Add Stock Quantity (+)</option>
              <option value="SUBTRACT">➖ Subtract Stock Quantity (-)</option>
              <option value="SET">🎯 Set Exact Stock Balance (=)</option>
            </select>
          </div>

          <Input
            label="Quantity Units"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
            required
          />

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
              Reason for Adjustment
            </label>
            <select
              className="ag-input"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReasonEnum)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)' }}
            >
              <option value="CORRECT_COUNT">Correct Inventory Stock Count</option>
              <option value="DAMAGE">Damaged Goods / Broken Shipment</option>
              <option value="LOSS">Stolen / Lost Inventory</option>
              <option value="EXPIRED">Expired Shelf Life</option>
            </select>
          </div>

          <Input
            label="Notes / Reference Details (Optional)"
            placeholder="e.g. Audit correction by manager"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
            Apply Stock Adjustment
          </Button>
        </form>
      </div>
    </Modal>
  );
};
