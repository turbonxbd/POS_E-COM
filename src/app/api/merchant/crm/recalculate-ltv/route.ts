import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { ltvCalculatorService } from '../../../../../../features/customer-crm/services/ltv-calculator.service';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const body = await request.json().catch(() => ({}));
    const { customerId = 'cust-101', additionalSpendBDT = 0 } = body;

    const updatedProfile = await ltvCalculatorService.recalculateCustomerLTV(
      auth.merchantId,
      customerId,
      Number(additionalSpendBDT)
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Customer LTV & Membership Tier recalculated successfully (${updatedProfile.membershipTier}).`,
        data: updatedProfile,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to recalculate customer LTV.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
