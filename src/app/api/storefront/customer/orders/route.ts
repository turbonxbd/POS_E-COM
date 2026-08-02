import { customerAccountService } from '../../../../../features/customer-website/services/customer-account.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || 'cust-101';
    const orderId = searchParams.get('orderId');
    const format = searchParams.get('format') || 'json';

    // HTML Invoice Output
    if (orderId && format === 'html') {
      const htmlInvoice = await customerAccountService.generateOrderInvoiceHTML(customerId, orderId);
      return new Response(htmlInvoice, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // JSON Order History Output
    const orders = await customerAccountService.getCustomerOrderHistory(customerId);

    return new Response(
      JSON.stringify({ success: true, data: orders }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer order history.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
