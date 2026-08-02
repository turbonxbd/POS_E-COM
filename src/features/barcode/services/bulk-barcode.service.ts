import { BulkBarcodeItemDTO, BarcodeSymbology, BARCODE_LABEL_PRESETS } from '../../../types/barcode.types';
import { barcodeRenderService } from './barcode-render.service';

export interface BulkItemInput {
  variantId: string;
  productName: string;
  variantName?: string;
  sku: string;
  barcode?: string;
  price: number;
  quantityPrinted: number;
}

export interface BulkBarcodeBatchResult {
  merchantId: string;
  totalLabelsCount: number;
  uniqueProductsCount: number;
  items: (BulkBarcodeItemDTO & { svgDataUrl: string })[];
  presetConfig: (typeof BARCODE_LABEL_PRESETS)[0];
}

/**
 * Enterprise Service for Batch Compiling Bulk Thermal Sticker Barcode Print Sheets.
 */
export class BulkBarcodeService {
  private static instance: BulkBarcodeService | null = null;

  private constructor() {}

  public static getInstance(): BulkBarcodeService {
    if (!BulkBarcodeService.instance) {
      BulkBarcodeService.instance = new BulkBarcodeService();
    }
    return BulkBarcodeService.instance;
  }

  /**
   * Compiles batch array of barcode sticker items with vector rendering data for thermal sheet printing.
   */
  public generateBulkBarcodes(
    merchantId: string,
    itemsList: BulkItemInput[],
    presetId = 'preset-50x25-single',
    symbology: BarcodeSymbology = 'CODE128'
  ): BulkBarcodeBatchResult {
    const preset = BARCODE_LABEL_PRESETS.find((p) => p.id === presetId) || BARCODE_LABEL_PRESETS[0];

    const compiledItems: (BulkBarcodeItemDTO & { svgDataUrl: string })[] = [];
    let totalLabelsCount = 0;

    for (const item of itemsList) {
      const barcodeCode = item.barcode || item.sku;
      const renderRes = barcodeRenderService.generateBarcodeSVG(barcodeCode, symbology);

      compiledItems.push({
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        barcode: renderRes.code,
        price: item.price,
        quantityPrinted: item.quantityPrinted,
        svgDataUrl: renderRes.svgDataUrl,
      });

      totalLabelsCount += item.quantityPrinted;
    }

    return {
      merchantId,
      totalLabelsCount,
      uniqueProductsCount: itemsList.length,
      items: compiledItems,
      presetConfig: preset,
    };
  }
}

export const bulkBarcodeService = BulkBarcodeService.getInstance();
