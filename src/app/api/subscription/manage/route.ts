import { subscriptionLifecycleService } from '../../../../features/subscription/services/lifecycle.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, merchantId, targetPlanId } = body;

    if (!merchantId || !action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "merchantId" and "action" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let result: any = null;

    switch (action.toUpperCase()) {
      case 'UPGRADE':
        if (!targetPlanId) throw new Error('Parameter "targetPlanId" is required for upgrade.');
        result = await subscriptionLifecycleService.upgradePlan(merchantId, targetPlanId);
        break;

      case 'DOWNGRADE':
        if (!targetPlanId) throw new Error('Parameter "targetPlanId" is required for downgrade.');
        result = await subscriptionLifecycleService.downgradePlan(merchantId, targetPlanId);
        break;

      case 'RENEW':
        result = await subscriptionLifecycleService.renewSubscription(merchantId);
        break;

      case 'CANCEL':
        result = await subscriptionLifecycleService.cancelSubscription(merchantId);
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unsupported subscription lifecycle action "${action}".`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process subscription lifecycle management request.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
