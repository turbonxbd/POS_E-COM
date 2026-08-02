import { BarcodeTemplateDTO } from '../../../types/barcode.types';

export interface CreateTemplatePayload {
  name: string;
  widthMm: number;
  heightMm: number;
  labelsPerRow: number;
  showStoreName?: boolean;
  showProductName?: boolean;
  showPrice?: boolean;
  showSKU?: boolean;
  showVariantName?: boolean;
  isDefault?: boolean;
}

/**
 * Enterprise Service for Managing Custom Thermal Sticker Templates and Physical Layout Configurations.
 */
export class BarcodeTemplateService {
  private static instance: BarcodeTemplateService | null = null;
  private templatesStore: Map<string, BarcodeTemplateDTO[]> = new Map();

  private constructor() {
    this.seedDefaultTemplates();
  }

  public static getInstance(): BarcodeTemplateService {
    if (!BarcodeTemplateService.instance) {
      BarcodeTemplateService.instance = new BarcodeTemplateService();
    }
    return BarcodeTemplateService.instance;
  }

  /**
   * Retrieves all label templates for a merchant.
   */
  public async getTemplates(merchantId: string): Promise<BarcodeTemplateDTO[]> {
    return this.templatesStore.get(merchantId) || [];
  }

  /**
   * Creates a new custom thermal sticker template.
   */
  public async createTemplate(
    merchantId: string,
    payload: CreateTemplatePayload
  ): Promise<BarcodeTemplateDTO> {
    const list = this.templatesStore.get(merchantId) || [];
    const templateId = `tmpl-${Date.now()}`;

    // Reset other defaults if new template is set to default
    if (payload.isDefault) {
      list.forEach((t) => (t.isDefault = false));
    }

    const newTemplate: BarcodeTemplateDTO = {
      id: templateId,
      merchantId,
      name: payload.name,
      widthMm: payload.widthMm,
      heightMm: payload.heightMm,
      labelsPerRow: payload.labelsPerRow || 1,
      showStoreName: payload.showStoreName !== false,
      showProductName: payload.showProductName !== false,
      showPrice: payload.showPrice !== false,
      showSKU: payload.showSKU !== false,
      showVariantName: payload.showVariantName !== false,
      isDefault: !!payload.isDefault,
      createdAt: new Date().toISOString(),
    };

    list.push(newTemplate);
    this.templatesStore.set(merchantId, list);
    return newTemplate;
  }

  /**
   * Updates an existing barcode label template.
   */
  public async updateTemplate(
    merchantId: string,
    templateId: string,
    payload: Partial<CreateTemplatePayload>
  ): Promise<BarcodeTemplateDTO> {
    const list = this.templatesStore.get(merchantId) || [];
    const index = list.findIndex((t) => t.id === templateId);

    if (index === -1) {
      throw new Error(`Barcode Template ID "${templateId}" not found.`);
    }

    if (payload.isDefault) {
      list.forEach((t) => (t.isDefault = false));
    }

    const target = list[index];
    const updated: BarcodeTemplateDTO = {
      ...target,
      ...payload,
    };

    list[index] = updated;
    this.templatesStore.set(merchantId, list);
    return updated;
  }

  private seedDefaultTemplates(): void {
    const demoId = 'merch-techstore';
    const seed: BarcodeTemplateDTO[] = [
      {
        id: 'tmpl-50x25-default',
        merchantId: demoId,
        name: 'Standard 50mm x 25mm Single Thermal Sticker',
        widthMm: 50,
        heightMm: 25,
        labelsPerRow: 1,
        showStoreName: true,
        showProductName: true,
        showPrice: true,
        showSKU: true,
        showVariantName: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tmpl-38x25-dual',
        merchantId: demoId,
        name: 'Dual 38mm x 25mm 2-Up Thermal Sticker',
        widthMm: 38,
        heightMm: 25,
        labelsPerRow: 2,
        showStoreName: true,
        showProductName: true,
        showPrice: true,
        showSKU: true,
        showVariantName: false,
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
    ];
    this.templatesStore.set(demoId, seed);
  }
}

export const barcodeTemplateService = BarcodeTemplateService.getInstance();
