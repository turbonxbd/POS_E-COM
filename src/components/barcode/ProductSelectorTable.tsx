import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BulkBarcodeItemDTO } from '../../types/barcode.types';

export interface ProductSelectorTableProps {
  queue: BulkBarcodeItemDTO[];
  onUpdateQueueQuantity: (variantId: string, quantity: number) => void;
  onRemoveFromQueue: (variantId: string) => void;
  onAddSampleItem: () => void;
}

export const ProductSelectorTable: React.FC<ProductSelectorTableProps> = ({
  queue,
  onUpdateQueueQuantity,
  onRemoveFromQueue,
  onAddSampleItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Card className="ag-barcode-product-selector">
      <CardHeader style={{ paddingBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <CardTitle style={{ fontSize: '1.125rem' }}>Print Queue Items</CardTitle>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Select products and specify label quantities to print
          </span>
        </div>
        <Button variant="outline" size="xs" onClick={onAddSampleItem}>
          ➕ Add Product Item
        </Button>
      </CardHeader>

      <CardContent style={{ padding: '0 1.25rem 1.25rem' }}>
        <Input
          placeholder="Search products by SKU or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        {queue.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', border: '1px dashed var(--border)', borderRadius: 'var(--border-radius)' }}>
            Print queue is empty. Click "Add Product Item" above to queue sticker labels.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {queue.map((item) => (
              <div
                key={item.variantId}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--card)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                    SKU: {item.sku} • ৳{item.price.toLocaleString()} BDT
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Copies:</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantityPrinted}
                      onChange={(e) => onUpdateQueueQuantity(item.variantId, parseInt(e.target.value || '1', 10))}
                      style={{
                        width: '3.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontSize: '0.8125rem',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }}
                    onClick={() => onRemoveFromQueue(item.variantId)}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
