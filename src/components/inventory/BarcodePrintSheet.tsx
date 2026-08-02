import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductDTO } from '../../types/inventory.types';
import { barcodeService } from '../../features/inventory/services/barcode.service';

export interface BarcodePrintSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDTO | null;
}

export const BarcodePrintSheet: React.FC<BarcodePrintSheetProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!product) return null;

  const variant = product.variants?.[0];
  const sku = variant?.sku || 'SKU-NONE';
  const barcodeValue = variant?.barcode || '880912345678';
  const barcodeSvgUrl = barcodeService.generateBarcodeData(sku);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Product Barcode Labels">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
          Preview thermal sticker label for <strong>{product.name}</strong>.
        </p>

        {/* Printable Sticker Label Preview */}
        <div
          className="ag-printable-label-sheet"
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--border-radius)',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            color: '#000000',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            maxWidth: '18rem',
            margin: '0 auto',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TechStore Bangladesh
          </div>

          <div style={{ fontSize: '0.9375rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {product.name}
          </div>

          {/* Barcode Image */}
          <img
            src={barcodeSvgUrl}
            alt={sku}
            style={{ width: '100%', maxHeight: '4.5rem', objectFit: 'contain' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', marginTop: '0.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.375rem' }}>
            <span>SKU: {sku}</span>
            <strong style={{ fontSize: '0.875rem' }}>৳{product.sellingPrice.toLocaleString()} BDT</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="md" onClick={onClose} style={{ flex: 1 }}>
            Close
          </Button>
          <Button variant="primary" size="md" onClick={handlePrint} style={{ flex: 1 }}>
            🖨️ Print Label Sticker
          </Button>
        </div>
      </div>
    </Modal>
  );
};
