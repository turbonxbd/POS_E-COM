import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { checkoutService } from '../../../../../features/pos/services/checkout.service';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error || 'Unauthorized merchant access.' }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      registerId,
      sessionId,
      cashierId,
      customerId,
      cartItems,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentSplits,
      notes,
      warehouseId,
    } = body;

    if (!registerId || !sessionId || !cartItems || cartItems.length === 0 || !paymentSplits || paymentSplits.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters ("registerId", "sessionId", "cartItems", "paymentSplits").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await checkoutService.processPOSCheckout({
      merchantId: auth.merchantId,
      registerId,
      sessionId,
      cashierId: cashierId || auth.user?.id || 'cashier-01',
      cashierName: auth.user?.name || 'Cashier',
      customerId,
      cartItems,
      subtotal,
      discountAmount: discountAmount || 0,
      taxAmount: taxAmount || 0,
      grandTotal,
      paymentSplits,
      notes,
      warehouseId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to process POS checkout transaction.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
