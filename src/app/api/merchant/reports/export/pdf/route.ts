import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { financialReportService } from '../../../../../../features/reports/services/financial-report.service';
import { salesReportService } from '../../../../../../features/reports/services/sales-report.service';
import { inventoryReportService } from '../../../../../../features/reports/services/inventory-report.service';
import { PDFReportGenerator } from '../../../../../../features/reports/export/pdf-generator';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'PROFIT_LOSS').toUpperCase() as 'SALES' | 'PROFIT_LOSS' | 'INVENTORY';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    let reportData: any;
    if (type === 'PROFIT_LOSS') {
      reportData = await financialReportService.getProfitLossReport(auth.merchantId, startDate, endDate);
    } else if (type === 'SALES') {
      reportData = await salesReportService.getSalesReport(auth.merchantId, startDate, endDate);
    } else if (type === 'INVENTORY') {
      reportData = await inventoryReportService.getInventoryValuationReport(auth.merchantId);
    }

    const dateRangeLabel = startDate && endDate
      ? `${startDate} to ${endDate}`
      : 'Current Billing Period';

    const htmlContent = PDFReportGenerator.generatePDFReportHTML(
      type,
      reportData,
      { storeName: 'TechStore Bangladesh' },
      dateRangeLabel
    );

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${type.toLowerCase()}_report_${Date.now()}.html"`,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate PDF financial report.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
