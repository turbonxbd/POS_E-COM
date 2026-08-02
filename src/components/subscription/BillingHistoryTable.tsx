import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SubscriptionInvoice } from '../../types/subscription.types';

export interface BillingHistoryTableProps {
  invoices: SubscriptionInvoice[];
  onDownloadInvoice?: (invoiceId: string) => void;
}

export const BillingHistoryTable: React.FC<BillingHistoryTableProps> = ({
  invoices,
  onDownloadInvoice,
}) => {
  const getStatusBadge = (status: SubscriptionInvoice['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return <span className="ag-badge ag-badge-success">PAID</span>;
      case 'PENDING':
        return <span className="ag-badge ag-badge-warning">PENDING</span>;
      case 'FAILED':
        return <span className="ag-badge ag-badge-danger">FAILED</span>;
      case 'REFUNDED':
        return <span className="ag-badge ag-badge-outline">REFUNDED</span>;
      default:
        return <span className="ag-badge ag-badge-outline">{status}</span>;
    }
  };

  return (
    <Card className="ag-billing-history-card">
      <CardHeader>
        <CardTitle style={{ fontSize: '1.25rem' }}>Billing & Invoice History</CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 0 }}>
        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted-foreground)' }}>
            No invoice records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ag-feature-matrix-table" style={{ border: 'none', borderRadius: 0 }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700 }}>${inv.totalAmount.toFixed(2)}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{inv.paymentMethod || '—'}</td>
                    <td>{getStatusBadge(inv.paymentStatus)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadInvoice && onDownloadInvoice(inv.id)}
                      >
                        📄 Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
