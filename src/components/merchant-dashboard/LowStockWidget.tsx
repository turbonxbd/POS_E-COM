import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LowStockItem } from '../../types/merchant-dashboard.types';

export interface LowStockWidgetProps {
  items: LowStockItem[];
  isLoading?: boolean;
  onRestockClick?: (productId: string) => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  items,
  isLoading,
  onRestockClick,
}) => {
  return (
    <Card className="ag-low-stock-widget">
      <CardHeader style={{ paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <CardTitle style={{ fontSize: '1.125rem' }}>Low Stock Inventory Alerts</CardTitle>
        </div>
        <span className="ag-badge ag-badge-danger">{items.length} Critical</span>
      </CardHeader>

      <CardContent style={{ padding: '0 1.25rem 1.25rem' }}>
        {isLoading ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Scanning inventory status...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            🎉 Inventory stock levels are healthy. No items below threshold.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    {item.productName}
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    SKU: {item.sku} • Category: {item.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444' }}>
                      {item.currentStock} {item.unit} left
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      Limit: {item.reorderThreshold}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="ag-btn ag-btn-xs ag-btn-primary"
                    onClick={() => onRestockClick && onRestockClick(item.id)}
                  >
                    Restock
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
