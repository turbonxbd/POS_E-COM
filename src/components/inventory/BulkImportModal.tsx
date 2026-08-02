import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSubmit: (csvContent: string) => Promise<{
    success: boolean;
    data?: {
      totalProcessed: number;
      succeededCount: number;
      failedCount: number;
      errors: { rowNumber: number; sku: string; reason: string }[];
    };
    error?: string;
  }>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportSubmit,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const sampleCSV = `Product Name,Category,SKU,Barcode,Selling Price,Cost Price,Stock Quantity
Premium T-Shirt,Clothing,SKU-TSHIRT-01,88091234567,850,450,50
Wireless Earbuds,Electronics,SKU-EARBUDS-01,88091234568,2500,1400,20`;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setReport(null);

    if (!csvContent.trim()) {
      setErrorMessage('Please paste or upload valid CSV content.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onImportSubmit(csvContent);
      setIsLoading(false);

      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to import CSV data.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred during CSV import.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk CSV Product & Stock Import">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
          Upload or paste CSV product lines to batch create catalog items and initial inventory stock.
        </p>

        {/* Sample Download Button */}
        <div style={{ backgroundColor: 'var(--muted)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem' }}>Need format template?</span>
          <button
            type="button"
            className="ag-btn ag-btn-xs ag-btn-outline"
            onClick={() => setCsvContent(sampleCSV)}
          >
            📋 Load Sample CSV
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {report ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#10b981', fontSize: '1rem' }}>Import Completed!</h4>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Processed <strong>{report.totalProcessed}</strong> rows: <strong>{report.succeededCount}</strong> succeeded, <strong>{report.failedCount}</strong> failed.
              </p>
            </div>

            {report.errors.length > 0 && (
              <div style={{ maxHeight: '10rem', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', padding: '0.5rem' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#ef4444' }}>Import Errors Log:</strong>
                {report.errors.map((err: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                    Row #{err.rowNumber} (SKU: {err.sku}): {err.reason}
                  </div>
                ))}
              </div>
            )}

            <Button variant="primary" size="md" onClick={onClose} style={{ width: '100%' }}>
              Close Import Tool
            </Button>
          </div>
        ) : (
          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                CSV Raw Content
              </label>
              <textarea
                className="ag-input"
                rows={8}
                placeholder="Product Name,Category,SKU,Barcode,Selling Price,Cost Price,Stock Quantity..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8125rem', padding: '0.5rem' }}
                required
              />
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
              Process & Batch Import CSV
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};
