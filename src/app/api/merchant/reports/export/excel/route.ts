import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { financialReportService } from '../../../../../../features/reports/services/financial-report.service';
import { salesReportService } from '../../../../../../features/reports/services/sales-report.service';
import { inventoryReportService } from '../../../../../../features/reports/services/inventory-report.service';
import { ExcelReportGenerator } from '../../../../../../features/reports/export/excel-generator';

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

    const xmlContent = ExcelReportGenerator.generateExcelSpreadsheet(type, reportData);

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type.toLowerCase()}_report_${Date.now()}.xls"`,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to export Excel spreadsheet report.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
