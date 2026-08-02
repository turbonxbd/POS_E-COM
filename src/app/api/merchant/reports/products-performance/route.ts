import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { productReportService } from '../../../../../features/reports/services/product-report.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    const topSelling = await productReportService.getTopSellingProducts(
      auth.merchantId,
      startDate,
      endDate,
      limit
    );

    const marginReport = await productReportService.getProductMarginReport(auth.merchantId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          topSelling,
          marginReport,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch product performance analytics.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
