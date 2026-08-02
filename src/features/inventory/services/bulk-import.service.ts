import { catalogService } from './catalog.service';
import { stockAdjustmentService } from './stock-adjustment.service';

export interface CSVRowError {
  rowNumber: number;
  sku: string;
  reason: string;
}

export interface ImportSummaryReport {
  totalProcessed: number;
  succeededCount: number;
  failedCount: number;
  errors: CSVRowError[];
}

/**
 * Enterprise Service for Bulk CSV Product Catalog & Stock Import with Row Validation & Detailed Error Reporting.
 */
export class BulkImportService {
  private static instance: BulkImportService | null = null;

  private constructor() {}

  public static getInstance(): BulkImportService {
    if (!BulkImportService.instance) {
      BulkImportService.instance = new BulkImportService();
    }
    return BulkImportService.instance;
  }

  /**
   * Parses CSV string lines, validates inputs, batch registers products & initial warehouse stock.
   */
  public async processCSVImport(
    merchantId: string,
    csvContent: string,
    warehouseId = 'wh-main'
  ): Promise<ImportSummaryReport> {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return {
        totalProcessed: 0,
        succeededCount: 0,
        failedCount: 0,
        errors: [{ rowNumber: 1, sku: 'HEADER', reason: 'CSV file is empty or missing data rows.' }],
      };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1);

    const errors: CSVRowError[] = [];
    let succeededCount = 0;
    const seenSKUs = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // Line 1 is header
      const cols = rows[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

      const name = cols[0] || '';
      const categoryName = cols[1] || 'General';
      const sku = (cols[2] || '').toUpperCase();
      const barcode = cols[3] || '';
      const sellingPrice = parseFloat(cols[4] || '0');
      const costPrice = parseFloat(cols[5] || '0');
      const stockQty = parseInt(cols[6] || '0', 10);

      // Row Validation
      if (!name) {
        errors.push({ rowNumber: rowNum, sku, reason: 'Product Name is required.' });
        continue;
      }
      if (!sku) {
        errors.push({ rowNumber: rowNum, sku, reason: 'SKU is required.' });
        continue;
      }
      if (seenSKUs.has(sku)) {
        errors.push({ rowNumber: rowNum, sku, reason: `Duplicate SKU "${sku}" found in CSV batch.` });
        continue;
      }
      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        errors.push({ rowNumber: rowNum, sku, reason: 'Selling Price must be greater than 0.' });
        continue;
      }

      seenSKUs.add(sku);

      try {
        // Create Product & Variant
        const product = await catalogService.createProduct(merchantId, {
          name,
          basePrice: sellingPrice,
          costPrice,
          sellingPrice,
          isVariant: false,
        });

        // Set Initial Stock in target warehouse
        if (stockQty > 0 && product.variants?.[0]) {
          await stockAdjustmentService.adjustStock(merchantId, {
            warehouseId,
            variantId: product.variants[0].id,
            adjustmentType: 'SET',
            quantity: stockQty,
            reason: 'CORRECT_COUNT',
            notes: `Initial stock from Bulk CSV Import`,
            createdBy: 'system-bulk-import',
          });
        }

        succeededCount++;
      } catch (err: any) {
        errors.push({ rowNumber: rowNum, sku, reason: err.message || 'Failed to insert product row.' });
      }
    }

    return {
      totalProcessed: rows.length,
      succeededCount,
      failedCount: errors.length,
      errors,
    };
  }
}

export const bulkImportService = BulkImportService.getInstance();
