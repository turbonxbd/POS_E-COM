import { barcodeService } from '../../src/features/inventory/services/barcode.service';

describe('BarcodeService - Unit Tests', () => {
  it('should generate valid EAN-13 barcode with correct 13-digit length', async () => {
    const code = await barcodeService.generateEAN13('SKU-1001');
    expect(code).toBeDefined();
    expect(code.length).toBe(13);
    expect(/^\d{13}$/.test(code)).toBe(true);
  });

  it('should generate valid Code-128 barcode matching SKU', async () => {
    const code = await barcodeService.generateCode128('SKU-IPHONE13');
    expect(code).toBe('SKU-IPHONE13');
  });
});
