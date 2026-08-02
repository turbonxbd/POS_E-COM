export type BarcodeSymbology = 'CODE128' | 'EAN13' | 'UPCA' | 'QR_CODE';

export interface LabelDimensions {
  widthMm: number;
  heightMm: number;
  labelsPerRow: number;
}

export interface BarcodeTemplateDTO {
  id: string;
  merchantId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  labelsPerRow: number;
  showStoreName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showSKU: boolean;
  showVariantName: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export interface BulkBarcodeItemDTO {
  variantId: string;
  productName: string;
  variantName?: string;
  sku: string;
  barcode: string;
  price: number;
  quantityPrinted: number;
}

export interface PrintSheetConfig {
  template: BarcodeTemplateDTO;
  items: BulkBarcodeItemDTO[];
  symbology: BarcodeSymbology;
  storeName?: string;
}

export interface BarcodePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  labelsPerRow: number;
  description: string;
}

/**
 * Standard Bangladesh Retail Sticker Presets (Single Thermal, Dual Sticker, Jewelry Tag, A4 Sheet).
 */
export const BARCODE_LABEL_PRESETS: BarcodePreset[] = [
  {
    id: 'preset-50x25-single',
    name: '50mm x 25mm (Standard Single Thermal)',
    widthMm: 50,
    heightMm: 25,
    labelsPerRow: 1,
    description: 'Most popular single sticker size for POS thermal label printers (Xprinter, TSC, Zebra).',
  },
  {
    id: 'preset-38x25-dual',
    name: '38mm x 25mm (2-Up Dual Sticker Sheet)',
    widthMm: 38,
    heightMm: 25,
    labelsPerRow: 2,
    description: '2 sticker labels per row side-by-side for high volume retail printing.',
  },
  {
    id: 'preset-25x15-mini',
    name: '25mm x 15mm (Jewelry & Small Tag)',
    widthMm: 25,
    heightMm: 15,
    labelsPerRow: 2,
    description: 'Compact mini sticker for jewelry, cables, accessories, and small items.',
  },
  {
    id: 'preset-a4-24up',
    name: 'A4 Paper Sheet (24 Stickers / Page)',
    widthMm: 70,
    heightMm: 37,
    labelsPerRow: 3,
    description: 'Standard A4 paper sticker grid for standard inkjet/laser office printers.',
  },
];
