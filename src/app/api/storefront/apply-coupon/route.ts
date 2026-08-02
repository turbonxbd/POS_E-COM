import { storefrontCartService } from '../../../../features/customer-website/services/cart.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { couponCode, subtotal } = body;

    if (!couponCode || subtotal === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "couponCode" and "subtotal" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = storefrontCartService.validateCoupon(couponCode, Number(subtotal));

    if (!result.isValid) {
      return new Response(
        JSON.stringify({ success: false, error: result.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to apply coupon code.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
