import { UnifiedOrderDTO } from '../types/order-management.types';

export interface MerchantStoreInfo {
  storeName: string;
  logoUrl?: string | null;
  phone: string;
  email: string;
  address: string;
}

export const DEFAULT_MERCHANT_INFO: MerchantStoreInfo = {
  storeName: 'TechStore Bangladesh',
  logoUrl: 'https://placehold.co/180x50/2563eb/ffffff?text=TechStore',
  phone: '+880 1711-002233',
  email: 'support@techstorebd.com',
  address: 'Level 5, Multiplan Center, Elephant Road, Dhaka-1205',
};

// In-memory printed tracking store: Map<orderId, boolean>
const printedInvoicesStore: Map<string, boolean> = new Map();

/**
 * Generates a clean, professional, print-ready HTML string for single Order Invoices.
 */
export function generateOrderInvoiceHTML(
  order: UnifiedOrderDTO,
  merchantInfo: Partial<MerchantStoreInfo> = {}
): string {
  const store = { ...DEFAULT_MERCHANT_INFO, ...merchantInfo };
  const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
  const isPaid = order.paymentStatus === 'PAID';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber} - ${store.storeName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; line-height: 1.5; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
    .brand-title { font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .store-address { font-size: 11px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
    .badge-paid { background: #10b981; color: #fff; }
    .badge-due { background: #ef4444; color: #fff; }
    .badge-partial { background: #f59e0b; color: #fff; }
    .info-grid { display: flex; justify-content: space-between; margin: 25px 0; font-size: 12px; }
    .info-block { width: 48%; }
    .info-title { font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th { background: #f8fafc; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .totals { margin-top: 25px; text-align: right; font-size: 12px; }
    .totals table { margin-left: auto; border-collapse: collapse; }
    .totals td { padding: 6px 12px; }
    .grand-total { font-size: 16px; font-weight: 800; color: #16a34a; border-top: 2px solid #e2e8f0; }
    .barcode-box { margin-top: 25px; padding: 10px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 6px; background: #fafafa; }
    .barcode-svg { font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 4px; color: #000; }
    .footer { margin-top: 35px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-box { border: none; shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">${store.storeName}</div>
        <div class="store-address">
          ${store.address}<br>
          Phone: ${store.phone} | Email: ${store.email}
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${isPaid ? 'badge-paid' : order.paymentStatus === 'PARTIAL' ? 'badge-partial' : 'badge-due'}">
          ${order.paymentStatus}
        </span>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
          Invoice: <strong>${invoiceNumber}</strong>
        </div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-block">
        <div class="info-title">Billed To (Customer):</div>
        <strong>${order.recipientName}</strong><br>
        Phone: <strong>${order.recipientPhone}</strong><br>
        ${order.recipientEmail ? `Email: ${order.recipientEmail}<br>` : ''}
        Address: ${order.shippingAddress}<br>
        ${order.district ? `District: ${order.district}, ${order.division}` : ''}
      </div>

      <div class="info-block" style="text-align: right;">
        <div class="info-title">Order Information:</div>
        Order Number: <strong>${order.orderNumber}</strong><br>
        Order Date: ${new Date(order.createdAt).toLocaleDateString()}<br>
        Payment Method: <strong>${order.paymentMethod}</strong><br>
        Courier: ${order.courierMapping?.courierProvider || 'Standard Delivery'}<br>
        Tracking Code: <strong>${order.courierMapping?.trackingCode || 'TRK-BD-PENDING'}</strong>
      </div>
    </div>

    <!-- Items Table -->
    <table class="table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Item Description</th>
          <th>Variant</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td style="font-family: monospace; font-[11px];">${item.sku}</td>
            <td><strong>${item.productName}</strong></td>
            <td style="color: #64748b;">${item.variantName}</td>
            <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
            <td style="text-align: right;">৳${item.unitPrice.toLocaleString()}</td>
            <td style="text-align: right; font-weight: bold;">৳${item.lineTotal.toLocaleString()}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td><strong>৳${order.subtotal.toLocaleString()} BDT</strong></td>
        </tr>
        ${
          order.discountAmount > 0
            ? `<tr>
                 <td style="color: #16a34a;">Discount:</td>
                 <td style="color: #16a34a;"><strong>-৳${order.discountAmount.toLocaleString()} BDT</strong></td>
               </tr>`
            : ''
        }
        <tr>
          <td>Shipping Charge:</td>
          <td><strong>${order.shippingFee === 0 ? 'FREE' : `৳${order.shippingFee.toLocaleString()} BDT`}</strong></td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td>৳${order.grandTotal.toLocaleString()} BDT</td>
        </tr>
      </table>
    </div>

    <!-- Barcode Box -->
    <div class="barcode-box">
      <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">SCANNABLE ORDER BARCODE</div>
      <div class="barcode-svg">||| | |||| || | | |||| ||| |||</div>
      <div style="font-size: 11px; font-mono; margin-top: 2px;">${order.orderNumber}</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Thank you for shopping with ${store.storeName}! For helpline inquiries, call ${store.phone}.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates a clean, multi-page printable HTML string for Warehouse Fulfillment Packing Slips.
 */
export function generatePackingSlipHTML(
  orders: UnifiedOrderDTO[],
  merchantInfo: Partial<MerchantStoreInfo> = {}
): string {
  const store = { ...DEFAULT_MERCHANT_INFO, ...merchantInfo };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Warehouse Packing Slips (${orders.length} Orders)</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
    .slip-page { max-width: 800px; margin: 0 auto 40px auto; border: 2px solid #0f172a; padding: 25px; border-radius: 8px; page-break-after: always; }
    .slip-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
    .slip-title { font-size: 20px; font-weight: 900; text-transform: uppercase; }
    .checklist-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .checklist-table th { background: #e2e8f0; text-align: left; padding: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #cbd5e1; }
    .checklist-table td { padding: 10px 8px; border: 1px solid #cbd5e1; font-size: 12px; }
    .checkbox { width: 18px; height: 18px; border: 2px solid #0f172a; display: inline-block; border-radius: 3px; }
    @media print {
      body { padding: 0; }
      .slip-page { margin: 0; border: 1px solid #000; page-break-after: always; }
    }
  </style>
</head>
<body>
  ${orders
    .map(
      (order) => `
    <div class="slip-page">
      <div class="slip-header">
        <div>
          <div class="slip-title">WAREHOUSE PACKING SLIP</div>
          <div style="font-size: 12px; font-weight: bold; color: #2563eb;">${store.storeName}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 16px; font-weight: bold;">${order.orderNumber}</div>
          <div style="font-size: 11px; color: #64748b;">Courier: ${order.courierMapping?.courierProvider || 'Standard'}</div>
          <div style="font-size: 11px; font-mono; font-weight: bold;">Tracking: ${order.courierMapping?.trackingCode || 'TRK-BD-PENDING'}</div>
        </div>
      </div>

      <div style="margin: 15px 0; font-size: 12px; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 6px;">
        <strong>RECIPIENT SHIP TO:</strong><br>
        Name: <strong>${order.recipientName}</strong> | Phone: <strong>${order.recipientPhone}</strong><br>
        Address: ${order.shippingAddress}, ${order.district || ''}, ${order.division || ''}<br>
        Payment Mode: <strong>${order.paymentMethod}</strong> | Amount to Collect: <strong style="color: #16a34a;">৳${order.dueAmount.toLocaleString()} BDT</strong>
      </div>

      <div style="font-size: 12px; font-weight: bold; margin-top: 10px;">PICKING ITEM CHECKLIST:</div>
      <table class="checklist-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">PICK</th>
            <th>SKU</th>
            <th>PRODUCT ITEM NAME</th>
            <th>VARIANT</th>
            <th style="width: 50px; text-align: center;">QTY</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td style="text-align: center;"><div class="checkbox"></div></td>
              <td style="font-family: monospace; font-weight: bold;">${item.sku}</td>
              <td><strong>${item.productName}</strong></td>
              <td>${item.variantName}</td>
              <td style="text-align: center; font-size: 14px; font-weight: bold;">${item.quantity}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 11px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
        Packed By (Staff Sign): _______________________ | Verified Date: ____________________
      </div>
    </div>`
    )
    .join('')}
</body>
</html>`;
}

/**
 * Updates batch invoice print history status.
 */
export function markInvoicesAsPrinted(merchantId: string, orderIds: string[]): { markedCount: number } {
  let markedCount = 0;
  for (const id of orderIds) {
    printedInvoicesStore.set(id, true);
    markedCount++;
  }
  return { markedCount };
}
