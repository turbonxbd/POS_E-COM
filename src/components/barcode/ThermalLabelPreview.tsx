import React from 'react';
import { BulkBarcodeItemDTO, BarcodePreset } from '../../types/barcode.types';
import { barcodeRenderService } from '../../features/barcode/services/barcode-render.service';

export interface ThermalLabelPreviewProps {
  item: BulkBarcodeItemDTO | null;
  preset: BarcodePreset;
  storeName?: string;
}

export const ThermalLabelPreview: React.FC<ThermalLabelPreviewProps> = ({
  item,
  preset,
  storeName = 'TechStore BD',
}) => {
  if (!item) {
    return (
      <div
        style={{
          border: '1px dashed var(--border)',
          borderRadius: 'var(--border-radius)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
        }}
      >
        Select items from the queue to render real-time thermal sticker preview.
      </div>
    );
  }

  const barcodeSvgUrl = barcodeRenderService.generateBarcodeData(item.sku);

  return (
    <div
      className="ag-thermal-preview-container"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)',
        padding: '1.25rem',
        backgroundColor: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
        Live Thermal Roll Preview ({preset.widthMm}mm x {preset.heightMm}mm)
      </div>

      {/* Simulated Thermal Sticker Label */}
      <div
        className="ag-thermal-label-sticker"
        style={{
          width: `${preset.widthMm * 3.5}px`,
          height: `${preset.heightMm * 3.5}px`,
          backgroundColor: '#ffffff',
          color: '#000000',
          border: '1px solid #cbd5e1',
          boxShadow: 'var(--shadow-md)',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {storeName}
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0.125rem 0', lineHeight: 1.1 }}>
          {item.productName}
        </div>

        <img src={barcodeSvgUrl} alt={item.sku} style={{ width: '90%', height: '2.5rem', objectFit: 'contain' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.625rem', fontFamily: 'monospace', borderTop: '1px solid #e2e8f0', paddingTop: '0.125rem' }}>
          <span>SKU: {item.sku}</span>
          <strong style={{ fontSize: '0.6875rem' }}>৳{item.price.toLocaleString()} BDT</strong>
        </div>
      </div>
    </div>
  );
};
