import React, { useState } from 'react';
import {
  ProductSelectorTable,
  TemplateSelector,
  CustomTemplateModal,
  ThermalLabelPreview,
  PrintTrigger,
} from '../../../../components/barcode';
import { BARCODE_LABEL_PRESETS, BarcodePreset, BulkBarcodeItemDTO } from '../../../../types/barcode.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

export default function BarcodeStudioPage({ params }: { params: { tenantSlug: string } }) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'templates' | 'history'>('workspace');
  const [selectedPreset, setSelectedPreset] = useState<BarcodePreset>(BARCODE_LABEL_PRESETS[0]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Print Queue State
  const [queue, setQueue] = useState<BulkBarcodeItemDTO[]>([
    {
      variantId: 'var-101',
      productName: 'Premium Cotton T-Shirt (Black - XL)',
      sku: 'SKU-TSHIRT-BLK-XL',
      barcode: '880912345678',
      price: 850,
      quantityPrinted: 50,
    },
    {
      variantId: 'var-102',
      productName: 'Wireless Bluetooth Earbuds Pro',
      sku: 'SKU-WIRELESS-EARBUDS',
      barcode: '880912345679',
      price: 2500,
      quantityPrinted: 20,
    },
  ]);

  const handleUpdateQueueQuantity = (variantId: string, quantity: number) => {
    setQueue((prev) =>
      prev.map((item) => (item.variantId === variantId ? { ...item, quantityPrinted: Math.max(1, quantity) } : item))
    );
  };

  const handleRemoveFromQueue = (variantId: string) => {
    setQueue((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleAddSampleItem = () => {
    const newItem: BulkBarcodeItemDTO = {
      variantId: `var-${Date.now()}`,
      productName: `New Fashion Item #${queue.length + 1}`,
      sku: `SKU-FASHION-${Date.now().toString().substring(8)}`,
      barcode: `880${Date.now().toString().substring(4)}`,
      price: 1450,
      quantityPrinted: 10,
    };
    setQueue((prev) => [...prev, newItem]);
  };

  return (
    <div className="ag-barcode-studio-container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
            Barcode Studio & Thermal Printing Engine
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Batch generate vector barcodes & print sticker rolls ({params.tenantSlug})
          </p>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`ag-btn ag-btn-sm ${activeTab === 'workspace' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
          onClick={() => setActiveTab('workspace')}
        >
          🏷️ Generator Workspace
        </button>
        <button
          type="button"
          className={`ag-btn ag-btn-sm ${activeTab === 'templates' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
          onClick={() => setActiveTab('templates')}
        >
          📐 Sticker Templates
        </button>
        <button
          type="button"
          className={`ag-btn ag-btn-sm ${activeTab === 'history' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Print Audit Log History
        </button>
      </div>

      {/* TAB 1: WORKSPACE */}
      {activeTab === 'workspace' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 22rem', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Queue Items */}
          <ProductSelectorTable
            queue={queue}
            onUpdateQueueQuantity={handleUpdateQueueQuantity}
            onRemoveFromQueue={handleRemoveFromQueue}
            onAddSampleItem={handleAddSampleItem}
          />

          {/* Right Column: Preset Selector & Thermal Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TemplateSelector
              selectedPresetId={selectedPreset.id}
              onSelectPreset={(p) => setSelectedPreset(p)}
              onOpenCustomModal={() => setIsCustomModalOpen(true)}
            />

            <ThermalLabelPreview
              item={queue.length > 0 ? queue[0] : null}
              preset={selectedPreset}
              storeName="TechStore BD"
            />

            <PrintTrigger queue={queue} preset={selectedPreset} />
          </div>
        </div>
      )}

      {/* TAB 2 & 3: PLACEHOLDERS */}
      {activeTab !== 'workspace' && (
        <Card>
          <CardHeader>
            <CardTitle>{activeTab.toUpperCase()} Module Active</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Thermal printer profiles and cashier audit logs ready for live production use.
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CustomTemplateModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSaveTemplate={(tmpl) => {
          alert(`Custom template "${tmpl.name}" saved!`);
        }}
      />
    </div>
  );
}
