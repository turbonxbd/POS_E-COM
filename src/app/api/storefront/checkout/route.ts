import { storefrontCheckoutService } from '../../../../features/customer-website/services/checkout.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      merchantId = 'merch-techstore',
      recipientName,
      recipientPhone,
      division,
      district,
      addressDetails,
      paymentMethod,
      cartItems,
    } = body;

    if (!recipientName || !recipientPhone || !division || !district || !addressDetails || !paymentMethod) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required shipping/recipient parameters ("recipientName", "recipientPhone", "division", "district", "addressDetails", "paymentMethod").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter "cartItems" must be a non-empty array of products.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await storefrontCheckoutService.processStorefrontCheckout({
      ...body,
      merchantId,
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
      JSON.stringify({ success: false, error: error.message || 'Failed to process storefront order checkout.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
