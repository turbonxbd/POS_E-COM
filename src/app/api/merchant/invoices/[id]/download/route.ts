import { generateInvoiceHTML } from '../../../../../../lib/invoice-generator';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const htmlContent = generateInvoiceHTML({
      invoiceNumber: `INV-${params.id.toUpperCase()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      merchantName: 'TechStore BD',
      merchantEmail: 'owner@techstore.com',
      planName: 'Professional Plan',
      billingCycle: 'YEARLY',
      baseAmount: 468.0,
      discountAmount: 93.6,
      taxAmount: 0,
      totalAmount: 374.4,
      paymentMethod: 'bKash Online Payment',
      transactionId: `TXN-${params.id.toUpperCase()}-9988`,
      paymentStatus: 'PAID',
    });

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Invoice_${params.id}.html"`,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to download invoice PDF data.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
