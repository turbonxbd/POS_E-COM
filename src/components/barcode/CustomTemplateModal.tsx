import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BarcodeTemplateDTO } from '../../types/barcode.types';

export interface CustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: Partial<BarcodeTemplateDTO>) => void;
}

export const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({
  isOpen,
  onClose,
  onSaveTemplate,
}) => {
  const [name, setName] = useState('Custom Thermal Roll');
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(25);
  const [labelsPerRow, setLabelsPerRow] = useState(1);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTemplate({
      name,
      widthMm,
      heightMm,
      labelsPerRow,
      showStoreName,
      showProductName,
      showPrice,
      showSKU,
      showVariantName: true,
      isDefault: false,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Sticker Size Configurator">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Input label="Template Profile Name" value={name} onChange={(e) => setName(e.target.value)} required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Width (mm)"
            type="number"
            value={widthMm}
            onChange={(e) => setWidthMm(parseFloat(e.target.value || '50'))}
            required
          />
          <Input
            label="Height (mm)"
            type="number"
            value={heightMm}
            onChange={(e) => setHeightMm(parseFloat(e.target.value || '25'))}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
            Sticker Labels Per Row
          </label>
          <select
            className="ag-input"
            value={labelsPerRow}
            onChange={(e) => setLabelsPerRow(parseInt(e.target.value, 10))}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)' }}
          >
            <option value={1}>1 Label Per Row (Single Roll)</option>
            <option value={2}>2 Labels Per Row (Dual Sticker Roll)</option>
            <option value={3}>3 Labels Per Row (A4 Sticker Sheet Grid)</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <strong style={{ fontSize: '0.8125rem' }}>Label Element Visibility Toggles:</strong>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showStoreName} onChange={(e) => setShowStoreName(e.target.checked)} />
            Show Store Name Header
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showProductName} onChange={(e) => setShowProductName(e.target.checked)} />
            Show Product Title
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
            Show Price in BDT (৳)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSKU} onChange={(e) => setShowSKU(e.target.checked)} />
            Show Product SKU Code
          </label>
        </div>

        <Button type="submit" variant="primary" size="lg" style={{ width: '100%' }}>
          Save Custom Sticker Template
        </Button>
      </form>
    </Modal>
  );
};
