import { subscriptionBannerService } from '../../../../../features/merchant-dashboard/services/subscription-banner.service';

export async function GET() {
  try {
    const overview = await subscriptionBannerService.getSubscriptionStatusOverview('merch-techstore');

    return new Response(
      JSON.stringify({
        success: true,
        data: overview,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch merchant subscription overview.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
