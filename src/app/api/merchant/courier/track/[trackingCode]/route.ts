import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { courierService } from '../../../../../../features/order-management/courier/courier.service';
import { CourierProviderType } from '../../../../../../types/order-management.types';

export async function GET(
  request: Request,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const trackingCode = params.trackingCode;
    const { searchParams } = new URL(request.url);
    const provider = (searchParams.get('provider') || 'STEADFAST') as CourierProviderType;

    const trackingRes = await courierService.fetchTrackingStatus(provider, trackingCode);

    return new Response(
      JSON.stringify({ success: true, data: trackingRes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch live courier tracking status.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
