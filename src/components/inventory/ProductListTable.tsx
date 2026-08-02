import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/Table';
import { ProductDTO } from '../../types/inventory.types';

export interface ProductListTableProps {
  products: ProductDTO[];
  isLoading?: boolean;
  onAdjustStockClick?: (product: ProductDTO) => void;
  onPrintBarcodeClick?: (product: ProductDTO) => void;
}

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  isLoading,
  onAdjustStockClick,
  onPrintBarcodeClick,
}) => {
  return (
    <Card className="ag-product-list-card">
      <CardHeader style={{ paddingBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardTitle style={{ fontSize: '1.25rem' }}>Products & Variant Inventory Catalog</CardTitle>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
          Showing {products.length} products
        </span>
      </CardHeader>

      <CardContent style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Loading products catalog...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            No products found in catalog. Click "Add Product" or "Bulk CSV Import" to add items.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => {
                const variant = product.variants?.[0];
                const sku = variant?.sku || 'SKU-NONE';
                const barcode = variant?.barcode || 'N/A';

                // Simulated stock calculation
                const stockQty = sku.includes('DEFAULT') ? 45 : 3;
                const isOutOfStock = stockQty === 0;
                const isLowStock = stockQty > 0 && stockQty <= 10;

                return (
                  <TableRow key={product.id}>
                    <TableCell style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '4px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                          📦
                        </div>
                        <div>
                          <div>{product.name}</div>
                          {product.isVariant && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              {product.variants?.length} Variant(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{sku}</TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{barcode}</TableCell>
                    <TableCell>৳{product.costPrice.toLocaleString()} BDT</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>৳{product.sellingPrice.toLocaleString()} BDT</TableCell>
                    <TableCell>
                      <span
                        className={`ag-badge ${
                          isOutOfStock ? 'ag-badge-danger' : isLowStock ? 'ag-badge-warning' : 'ag-badge-success'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${stockQty})` : `In Stock (${stockQty})`}
                      </span>
                    </TableCell>

                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="ag-btn ag-btn-xs ag-btn-outline"
                          onClick={() => onAdjustStockClick && onAdjustStockClick(product)}
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          className="ag-btn ag-btn-xs ag-btn-secondary"
                          onClick={() => onPrintBarcodeClick && onPrintBarcodeClick(product)}
                        >
                          🏷️ Print Label
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
