export interface ReportMerchantInfo {
  storeName: string;
  logoUrl?: string | null;
  phone: string;
  email: string;
  address: string;
}

export const DEFAULT_REPORT_MERCHANT_INFO: ReportMerchantInfo = {
  storeName: 'TechStore Bangladesh',
  logoUrl: 'https://placehold.co/180x50/2563eb/ffffff?text=TechStore',
  phone: '+880 1711-002233',
  email: 'support@techstorebd.com',
  address: 'Level 5, Multiplan Center, Elephant Road, Dhaka-1205',
};

/**
 * Enterprise Service for Generating Printable A4 PDF HTML Documents for Financial & Business Reports.
 */
export class PDFReportGenerator {
  /**
   * Compiles print-ready A4 HTML document for Sales, Profit & Loss, or Inventory Valuation reports.
   */
  public static generatePDFReportHTML(
    reportType: 'SALES' | 'PROFIT_LOSS' | 'INVENTORY',
    data: any,
    merchantInfo: Partial<ReportMerchantInfo> = {},
    dateRangeLabel: string = 'Current Billing Period'
  ): string {
    const store = { ...DEFAULT_REPORT_MERCHANT_INFO, ...merchantInfo };
    const generatedAt = new Date().toLocaleString();

    let title = 'Financial & Business Report';
    let bodyContent = '';

    if (reportType === 'PROFIT_LOSS') {
      title = 'Profit & Loss Statement (P&L)';
      bodyContent = this.renderProfitLossHTML(data);
    } else if (reportType === 'SALES') {
      title = 'Sales Analytics & Revenue Performance';
      bodyContent = this.renderSalesReportHTML(data);
    } else if (reportType === 'INVENTORY') {
      title = 'Inventory Asset Valuation Audit';
      bodyContent = this.renderInventoryReportHTML(data);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${store.storeName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; line-height: 1.5; font-size: 12px; }
    .report-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
    .brand-title { font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .store-info { font-size: 11px; color: #64748b; margin-top: 4px; }
    .report-badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .meta-bar { display: flex; justify-content: space-between; margin: 20px 0; padding: 10px 14px; background: #f8fafc; border-radius: 6px; font-size: 11px; color: #475569; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
    .kpi-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 2px solid #cbd5e1; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .table tr:nth-child(even) { background: #f8fafc; }
    .totals-row td { font-weight: 800; background: #f1f5f9; border-top: 2px solid #cbd5e1; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
    @media print {
      body { padding: 0; background: none; }
      .report-box { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="report-box">
    <div class="header">
      <div>
        <div class="brand-title">${store.storeName}</div>
        <div class="store-info">${store.address} • ${store.phone} • ${store.email}</div>
      </div>
      <div style="text-align: right;">
        <span class="report-badge">${title}</span>
      </div>
    </div>

    <div class="meta-bar">
      <div><strong>Reporting Period:</strong> ${dateRangeLabel}</div>
      <div><strong>Generated On:</strong> ${generatedAt}</div>
    </div>

    ${bodyContent}

    <div class="footer">
      This is a computer-generated document from ${store.storeName} Merchant OS. No signature required.
    </div>
  </div>
</body>
</html>`;
  }

  private static renderProfitLossHTML(data: any): string {
    const revenue = data.totalSalesRevenue || 0;
    const cogs = data.costOfGoodsSold || 0;
    const grossProfit = data.grossProfit || 0;
    const expenses = data.totalOperationalExpenses || 0;
    const netProfit = data.netProfit || 0;

    return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Sales Revenue</div>
        <div class="kpi-val" style="color:#2563eb;">৳${revenue.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">COGS</div>
        <div class="kpi-val" style="color:#dc2626;">৳${cogs.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Gross Profit</div>
        <div class="kpi-val" style="color:#16a34a;">৳${grossProfit.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Net Profit</div>
        <div class="kpi-val" style="color:${netProfit >= 0 ? '#16a34a' : '#dc2626'};">৳${netProfit.toLocaleString()}</div>
      </div>
    </div>

    <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; margin-top: 25px;">P&L Statement Summary</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Financial Item</th>
          <th style="text-align: right;">Amount (BDT)</th>
          <th style="text-align: right;">% Margin</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Sales Revenue (Online + POS)</strong></td>
          <td style="text-align: right;">৳${revenue.toLocaleString()}</td>
          <td style="text-align: right;">100.00%</td>
        </tr>
        <tr>
          <td>Less: Cost of Goods Sold (COGS)</td>
          <td style="text-align: right; color:#dc2626;">-৳${cogs.toLocaleString()}</td>
          <td style="text-align: right;">${revenue > 0 ? ((cogs / revenue) * 100).toFixed(2) : '0.00'}%</td>
        </tr>
        <tr className="totals-row" style="background:#f1f5f9; font-weight:bold;">
          <td><strong>Gross Profit</strong></td>
          <td style="text-align: right; color:#16a34a;"><strong>৳${grossProfit.toLocaleString()}</strong></td>
          <td style="text-align: right;"><strong>${data.grossProfitMargin || 0}%</strong></td>
        </tr>
        <tr>
          <td>Less: Total Operational Expenses</td>
          <td style="text-align: right; color:#dc2626;">-৳${expenses.toLocaleString()}</td>
          <td style="text-align: right;">${revenue > 0 ? ((expenses / revenue) * 100).toFixed(2) : '0.00'}%</td>
        </tr>
        <tr style="background:#e0f2fe; font-weight:800; font-size:14px;">
          <td><strong>NET PROFIT / LOSS</strong></td>
          <td style="text-align: right; color:${netProfit >= 0 ? '#16a34a' : '#dc2626'};"><strong>৳${netProfit.toLocaleString()}</strong></td>
          <td style="text-align: right;"><strong>${data.netProfitMargin || 0}%</strong></td>
        </tr>
      </tbody>
    </table>`;
  }

  private static renderSalesReportHTML(data: any): string {
    const metrics = data.salesMetrics || data;
    return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Gross Revenue</div>
        <div class="kpi-val">৳${(metrics.totalRevenue || 0).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Orders</div>
        <div class="kpi-val">${metrics.totalOrdersCount || 0}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">POS Counter Sales</div>
        <div class="kpi-val">৳${(metrics.posSalesAmount || 0).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Online Web Sales</div>
        <div class="kpi-val">৳${(metrics.onlineSalesAmount || 0).toLocaleString()}</div>
      </div>
    </div>`;
  }

  private static renderInventoryReportHTML(data: any): string {
    const val = data.valuation || data;
    return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total SKU Count</div>
        <div class="kpi-val">${val.totalSKUCount || 0}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Stock Units</div>
        <div class="kpi-val">${val.totalStockUnits || 0}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Asset Cost (BDT)</div>
        <div class="kpi-val">৳${(val.totalAssetValuationCost || 0).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Retail Value (BDT)</div>
        <div class="kpi-val">৳${(val.totalAssetValuationRetail || 0).toLocaleString()}</div>
      </div>
    </div>`;
  }
}
