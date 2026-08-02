import { BulkBarcodeItemDTO, BarcodeTemplateDTO } from '../../../types/barcode.types';

export interface PrintLogEntry {
  id: string;
  merchantId: string;
  variantId: string;
  barcodeType: string;
  quantityPrinted: number;
  generatedBy: string;
  createdAt: string;
}

/**
 * Enterprise Service for Building Millimeter-Accurate Thermal Sticker HTML Documents and Tracking Print History.
 */
export class LabelLayoutService {
  private static instance: LabelLayoutService | null = null;
  private printLogsStore: Map<string, PrintLogEntry[]> = new Map();

  private constructor() {}

  public static getInstance(): LabelLayoutService {
    if (!LabelLayoutService.instance) {
      LabelLayoutService.instance = new LabelLayoutService();
    }
    return LabelLayoutService.instance;
  }

  /**
   * Generates clean standalone printable HTML document mapping exact physical mm dimensions for thermal roll printers.
   */
  public buildPrintSheetHTML(
    items: (BulkBarcodeItemDTO & { svgDataUrl: string })[],
    template: BarcodeTemplateDTO,
    storeName = 'TechStore BD'
  ): string {
    const widthMm = template.widthMm || 50;
    const heightMm = template.heightMm || 25;
    const isSingleRoll = template.labelsPerRow === 1;

    let stickersHTML = '';

    for (const item of items) {
      for (let q = 0; q < item.quantityPrinted; q++) {
        stickersHTML += `
        <div className="ag-thermal-label-sticker ${isSingleRoll ? 'ag-thermal-roll-single' : ''}"
             style="width: ${widthMm}mm; height: ${heightMm}mm;">
          ${template.showStoreName ? `<div class="ag-thermal-store-name">${storeName}</div>` : ''}
          ${template.showProductName ? `<div class="ag-thermal-product-title">${item.productName}</div>` : ''}

          <img src="${item.svgDataUrl}" alt="${item.sku}" class="ag-thermal-barcode-img" />

          <div class="ag-thermal-label-footer">
            ${template.showSKU ? `<span>SKU: ${item.sku}</span>` : '<span></span>'}
            ${template.showPrice ? `<strong>৳${item.price.toLocaleString()} BDT</strong>` : ''}
          </div>
        </div>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Print Barcode Sticker Sheet</title>
  <style>
    @page { margin: 0; size: auto; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #ffffff; color: #000000; }
    .ag-thermal-print-sheet { display: flex; flex-wrap: wrap; width: 100%; }
    .ag-thermal-label-sticker {
      box-sizing: border-box;
      padding: 1.5mm 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      page-break-inside: avoid;
    }
    .ag-thermal-roll-single { page-break-after: always; }
    .ag-thermal-store-name { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; }
    .ag-thermal-product-title { font-size: 8.5pt; font-weight: 700; max-height: 2.2em; overflow: hidden; }
    .ag-thermal-barcode-img { width: 95%; max-height: 10mm; object-fit: contain; }
    .ag-thermal-label-footer { display: flex; justify-content: space-between; width: 100%; font-size: 7pt; font-family: monospace; border-top: 0.5pt solid #000; padding-top: 0.5mm; }
  </style>
</head>
<body>
  <div class="ag-thermal-print-sheet">
    ${stickersHTML}
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;
  }

  /**
   * Logs sticker printing session activity into print history log table.
   */
  public async logPrintSession(
    merchantId: string,
    variantId: string,
    quantityPrinted: number,
    generatedBy = 'merchant-staff'
  ): Promise<PrintLogEntry> {
    const list = this.printLogsStore.get(merchantId) || [];
    const entry: PrintLogEntry = {
      id: `print-log-${Date.now()}`,
      merchantId,
      variantId,
      barcodeType: 'CODE128',
      quantityPrinted,
      generatedBy,
      createdAt: new Date().toISOString(),
    };

    list.push(entry);
    this.printLogsStore.set(merchantId, list);
    return entry;
  }
}

export const labelLayoutService = LabelLayoutService.getInstance();
