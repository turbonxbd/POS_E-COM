import { paymentService, WebhookPayload } from '../../../../features/subscription/services/payment.service';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-payment-signature') || request.headers.get('x-signature') || '';
    const body: WebhookPayload = await request.json();

    if (!body.invoiceId || !body.transactionId || !body.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid webhook payload structure.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Signature Verification
    const isValidSig = paymentService.verifyWebhookSignature(body, signature);
    if (!isValidSig) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized webhook request: Invalid HMAC signature.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.status === 'SUCCESS') {
      await paymentService.processPaymentSuccess(
        body.invoiceId,
        body.transactionId,
        body.paymentMethod
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified and subscription activated successfully.',
          data: {
            invoiceId: body.invoiceId,
            transactionId: body.transactionId,
            status: 'ACTIVE',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Payment status received as ${body.status}. Subscription untouched.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process payment webhook callback.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
