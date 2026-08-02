import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { rewardService } from '../../../../../../features/customer-crm/services/reward.service';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const body = await request.json();
    const { customerId, points, type = 'ADD', reason, orderId } = body;

    if (!customerId || !points || points <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "customerId" and positive integer "points" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let result: any;
    if (type === 'REDEEM') {
      result = await rewardService.redeemRewardPoints(
        auth.merchantId,
        customerId,
        Number(points),
        orderId
      );
    } else {
      result = await rewardService.addRewardPoints(
        auth.merchantId,
        customerId,
        Number(points),
        'MANUAL_ADJUSTMENT',
        reason || 'Manual staff adjustment',
        orderId
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
      JSON.stringify({ success: false, error: error.message || 'Failed to adjust reward points.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
