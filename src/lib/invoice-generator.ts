export interface InvoicePDFData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  merchantName: string;
  merchantEmail: string;
  merchantAddress?: string;
  planName: string;
  billingCycle: string;
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentStatus: string;
}

/**
 * Generates clean, printable HTML string for PDF invoice rendering.
 */
export function generateInvoiceHTML(data: InvoicePDFData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber} - Antigravity</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .status-badge { display: inline-block; padding: 6px 12px; background: #10b981; color: #fff; font-size: 12px; font-weight: bold; border-radius: 4px; }
    .info-grid { display: flex; justify-content: space-between; margin: 30px 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .table th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .totals { margin-top: 30px; text-align: right; }
    .totals table { margin-left: auto; border-collapse: collapse; }
    .totals td { padding: 8px 16px; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #e2e8f0; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div class="logo">⚡ Antigravity Platform</div>
      <div>
        <span class="status-badge">${data.paymentStatus.toUpperCase()}</span>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <strong style="font-size: 16px;">Billed To:</strong><br>
        ${data.merchantName}<br>
        ${data.merchantEmail}<br>
        ${data.merchantAddress || 'Dhaka, Bangladesh'}
      </div>
      <div style="text-align: right;">
        <strong style="font-size: 16px;">Invoice Details:</strong><br>
        Invoice #: <strong>${data.invoiceNumber}</strong><br>
        Date: ${new Date(data.issueDate).toLocaleDateString()}<br>
        Payment Method: ${data.paymentMethod}<br>
        ${data.transactionId ? `Txn ID: ${data.transactionId}` : ''}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Billing Cycle</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${data.planName}</strong> - Multi-Tenant Subscription</td>
          <td>${data.billingCycle}</td>
          <td>$${data.baseAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td>$${data.baseAmount.toFixed(2)}</td>
        </tr>
        ${
          data.discountAmount > 0
            ? `<tr>
                 <td style="color: #10b981;">Discount:</td>
                 <td style="color: #10b981;">-$${data.discountAmount.toFixed(2)}</td>
               </tr>`
            : ''
        }
        <tr>
          <td>Tax (VAT):</td>
          <td>$${data.taxAmount.toFixed(2)}</td>
        </tr>
        <tr class="grand-total">
          <td>Total Paid:</td>
          <td>$${data.totalAmount.toFixed(2)} USD</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      Thank you for choosing Antigravity Platform. For billing inquiries, email support@antigravity.app.
    </div>
  </div>
</body>
</html>`;
}
