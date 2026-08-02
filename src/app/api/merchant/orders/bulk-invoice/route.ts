import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { orderLifecycleService } from '../../../../../features/order-management/services/order-lifecycle.service';
import {
  generateOrderInvoiceHTML,
  generatePackingSlipHTML,
  markInvoicesAsPrinted,
} from '../../../../../lib/invoice-pdf';
import { UnifiedOrderDTO } from '../../../../../types/order-management.types';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const body = await request.json();
    const { orderIds, type = 'invoice', markPrinted = true } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter "orderIds" must be a non-empty array of order IDs.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const matchedOrders: UnifiedOrderDTO[] = [];
    for (const id of orderIds) {
      const ord = await orderLifecycleService.getOrderById(auth.merchantId, id);
      if (ord) matchedOrders.push(ord);
    }

    if (matchedOrders.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No matching orders found for provided order IDs.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (markPrinted) {
      markInvoicesAsPrinted(auth.merchantId, matchedOrders.map((o) => o.id));
    }

    let finalHtml = '';
    if (type === 'packing_slip') {
      finalHtml = generatePackingSlipHTML(matchedOrders);
    } else {
      finalHtml = matchedOrders.map((o) => generateOrderInvoiceHTML(o)).join('\n<div style="page-break-after: always;"></div>\n');
    }

    return new Response(finalHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate bulk order invoices/packing slips.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
