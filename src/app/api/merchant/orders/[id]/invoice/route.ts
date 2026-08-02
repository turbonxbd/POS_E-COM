import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { orderLifecycleService } from '../../../../../../features/order-management/services/order-lifecycle.service';
import { generateOrderInvoiceHTML } from '../../../../../../lib/invoice-pdf';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';

    const order = await orderLifecycleService.getOrderById(auth.merchantId, orderId);

    if (!order) {
      return new Response(
        JSON.stringify({ success: false, error: `Order "${orderId}" not found.` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = generateOrderInvoiceHTML(order);

    if (format === 'html') {
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          invoiceNumber: `INV-${order.orderNumber.replace('ORD-', '')}`,
          orderNumber: order.orderNumber,
          grandTotal: order.grandTotal,
          html,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate order invoice PDF/HTML.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
