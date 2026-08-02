import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { ltvCalculatorService } from '../../../../../../features/customer-crm/services/ltv-calculator.service';
import { segmentationService } from '../../../../../../features/customer-crm/services/segmentation.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const profiles = await ltvCalculatorService.getAllMerchantProfiles(auth.merchantId);
    const breakdown = segmentationService.getSegmentBreakdown(profiles);

    return new Response(
      JSON.stringify({ success: true, data: breakdown }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer CRM segment breakdown.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
