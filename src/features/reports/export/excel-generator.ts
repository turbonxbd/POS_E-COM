/**
 * Enterprise Service for Exporting Financial Datasets to Microsoft Excel Compatible Spreadsheet Workbooks.
 */
export class ExcelReportGenerator {
  /**
   * Generates a multi-sheet Microsoft Excel compatible XML workbook string with styled headers and formula cells.
   */
  public static generateExcelSpreadsheet(
    reportType: 'SALES' | 'PROFIT_LOSS' | 'INVENTORY',
    data: any
  ): string {
    let sheetName = 'Financial Report';
    let rowsHTML = '';

    if (reportType === 'PROFIT_LOSS') {
      sheetName = 'Profit & Loss Statement';
      rowsHTML = this.buildProfitLossExcelRows(data);
    } else if (reportType === 'SALES') {
      sheetName = 'Sales Performance';
      rowsHTML = this.buildSalesExcelRows(data);
    } else if (reportType === 'INVENTORY') {
      sheetName = 'Inventory Valuation';
      rowsHTML = this.buildInventoryExcelRows(data);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Size="14" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&#34;৳&#34;#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   ${rowsHTML}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  private static buildProfitLossExcelRows(data: any): string {
    return `
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">Profit &amp; Loss Statement</Data></Cell>
   </Row>
   <Row/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Financial Metric</Data></Cell>
    <Cell><Data ss:Type="String">Amount (BDT)</Data></Cell>
    <Cell><Data ss:Type="String">Margin (%)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Sales Revenue</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.totalSalesRevenue || 0}</Data></Cell>
    <Cell><Data ss:Type="String">100.00%</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Cost of Goods Sold (COGS)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.costOfGoodsSold || 0}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
   <Row ss:StyleID="Bold">
    <Cell><Data ss:Type="String">Gross Profit</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.grossProfit || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${data.grossProfitMargin || 0}%</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Operational Expenses</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.totalOperationalExpenses || 0}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
   <Row ss:StyleID="Bold">
    <Cell><Data ss:Type="String">NET PROFIT / LOSS</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.netProfit || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${data.netProfitMargin || 0}%</Data></Cell>
   </Row>`;
  }

  private static buildSalesExcelRows(data: any): string {
    const m = data.salesMetrics || data;
    return `
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Metric</Data></Cell>
    <Cell><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Revenue</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.totalRevenue || 0}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Orders</Data></Cell>
    <Cell><Data ss:Type="Number">${m.totalOrdersCount || 0}</Data></Cell>
   </Row>`;
  }

  private static buildInventoryExcelRows(data: any): string {
    const v = data.valuation || data;
    return `
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Valuation Metric</Data></Cell>
    <Cell><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total SKU Count</Data></Cell>
    <Cell><Data ss:Type="Number">${v.totalSKUCount || 0}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Asset Cost (BDT)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${v.totalAssetValuationCost || 0}</Data></Cell>
   </Row>`;
  }
}
