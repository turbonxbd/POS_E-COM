import React from 'react';
import { BARCODE_LABEL_PRESETS, BarcodePreset } from '../../types/barcode.types';

export interface TemplateSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: BarcodePreset) => void;
  onOpenCustomModal: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onOpenCustomModal,
}) => {
  return (
    <div
      className="ag-barcode-template-selector"
      style={{
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'var(--card)',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Thermal Sticker Paper Preset</label>
        <button
          type="button"
          onClick={onOpenCustomModal}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
        >
          ⚙️ Custom Size Configurator
        </button>
      </div>

      <select
        className="ag-input"
        value={selectedPresetId}
        onChange={(e) => {
          const found = BARCODE_LABEL_PRESETS.find((p) => p.id === e.target.value);
          if (found) onSelectPreset(found);
        }}
        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)', fontSize: '0.875rem' }}
      >
        {BARCODE_LABEL_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name} ({preset.widthMm}mm x {preset.heightMm}mm)
          </option>
        ))}
      </select>
    </div>
  );
};
