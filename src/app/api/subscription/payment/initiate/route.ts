import { paymentService, PaymentMethodType } from '../../../../../features/subscription/services/payment.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, paymentMethod } = body;

    if (!invoiceId || !paymentMethod) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "invoiceId" and "paymentMethod" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const initiationResult = await paymentService.initiateSubscriptionPayment(
      invoiceId,
      paymentMethod as PaymentMethodType
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: initiationResult,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to initiate subscription payment checkout.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
