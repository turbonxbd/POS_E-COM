import { SubscriptionInvoice } from '../../../../types/subscription.types';

export async function GET() {
  try {
    const mockInvoices: SubscriptionInvoice[] = [
      {
        id: 'inv-101',
        invoiceNumber: 'INV-2026-001',
        merchantId: 'merch-01',
        subscriptionId: 'sub-01',
        amount: 468.0,
        discountAmount: 93.6,
        taxAmount: 0,
        totalAmount: 374.4,
        paymentStatus: 'PAID',
        paymentMethod: 'BKASH',
        transactionId: 'TXN-BKASH-887766',
        pdfUrl: '/api/merchant/invoices/inv-101/download',
        createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      },
      {
        id: 'inv-102',
        invoiceNumber: 'INV-2026-002',
        merchantId: 'merch-01',
        subscriptionId: 'sub-01',
        amount: 30.0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 30.0,
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        transactionId: 'TXN-UPG-554433',
        pdfUrl: '/api/merchant/invoices/inv-102/download',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        data: mockInvoices,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch invoice history.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
