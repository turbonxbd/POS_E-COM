import { trackingService } from '../../../../features/customer-website/services/tracking.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merch-techstore';
    const orderNumber = searchParams.get('orderNumber') || searchParams.get('orderNo');
    const phone = searchParams.get('phone') || searchParams.get('mobile');

    if (!orderNumber || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Query parameters "orderNumber" and "phone" are required for public order tracking.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await trackingService.trackOrder(merchantId, orderNumber, phone);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to track order progress.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
