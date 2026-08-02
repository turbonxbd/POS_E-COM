import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { customerReportService } from '../../../../../features/reports/services/customer-report.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await customerReportService.getCustomerAnalyticsReport(
      auth.merchantId,
      startDate,
      endDate
    );

    return new Response(
      JSON.stringify({ success: true, data: report }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer cohort analytics report.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
