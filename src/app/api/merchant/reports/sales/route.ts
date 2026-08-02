import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { salesReportService } from '../../../../../features/reports/services/sales-report.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const salesMetrics = await salesReportService.getSalesReport(
      auth.merchantId,
      startDate,
      endDate
    );

    const paymentBreakdown = await salesReportService.getPaymentMethodReport(
      auth.merchantId,
      startDate,
      endDate
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          salesMetrics,
          paymentBreakdown,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch sales analytics report.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
