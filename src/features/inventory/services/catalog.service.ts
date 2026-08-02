import {
  CategoryDTO,
  BrandDTO,
  SupplierDTO,
  WarehouseDTO,
  ProductDTO,
  ProductVariantDTO,
} from '../../../types/inventory.types';
import { barcodeService } from './barcode.service';

export interface CreateProductPayload {
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  name: string;
  description?: string;
  basePrice: number;
  costPrice: number;
  sellingPrice: number;
  isVariant?: boolean;
  variants?: {
    variantName: string;
    costPrice?: number;
    sellingPrice?: number;
    attributes: Record<string, string>;
  }[];
}

/**
 * Enterprise Service for Managing Product Catalog, SKU Generation, Categories, Suppliers, and Warehouses.
 */
export class CatalogService {
  private static instance: CatalogService | null = null;
  private categoriesStore: Map<string, CategoryDTO[]> = new Map();
  private brandsStore: Map<string, BrandDTO[]> = new Map();
  private suppliersStore: Map<string, SupplierDTO[]> = new Map();
  private warehousesStore: Map<string, WarehouseDTO[]> = new Map();
  private productsStore: Map<string, ProductDTO[]> = new Map();

  private constructor() {
    this.seedDemoCatalog();
  }

  public static getInstance(): CatalogService {
    if (!CatalogService.instance) {
      CatalogService.instance = new CatalogService();
    }
    return CatalogService.instance;
  }

  // --- CATEGORIES ---

  public async getCategories(merchantId: string): Promise<CategoryDTO[]> {
    return this.categoriesStore.get(merchantId) || [];
  }

  public async createCategory(
    merchantId: string,
    data: { name: string; parentId?: string; imageUrl?: string }
  ): Promise<CategoryDTO> {
    const list = this.categoriesStore.get(merchantId) || [];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newCategory: CategoryDTO = {
      id: `cat-${Date.now()}`,
      merchantId,
      name: data.name,
      slug,
      parentId: data.parentId || null,
      imageUrl: data.imageUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    list.push(newCategory);
    this.categoriesStore.set(merchantId, list);
    return newCategory;
  }

  // --- BRANDS ---

  public async getBrands(merchantId: string): Promise<BrandDTO[]> {
    return this.brandsStore.get(merchantId) || [];
  }

  public async createBrand(
    merchantId: string,
    data: { name: string; logoUrl?: string }
  ): Promise<BrandDTO> {
    const list = this.brandsStore.get(merchantId) || [];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newBrand: BrandDTO = {
      id: `brand-${Date.now()}`,
      merchantId,
      name: data.name,
      slug,
      logoUrl: data.logoUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    list.push(newBrand);
    this.brandsStore.set(merchantId, list);
    return newBrand;
  }

  // --- SUPPLIERS & WAREHOUSES ---

  public async getSuppliers(merchantId: string): Promise<SupplierDTO[]> {
    return this.suppliersStore.get(merchantId) || [];
  }

  public async createSupplier(
    merchantId: string,
    data: { name: string; phone: string; companyName?: string; email?: string; address?: string; taxNumber?: string }
  ): Promise<SupplierDTO> {
    const list = this.suppliersStore.get(merchantId) || [];

    const newSupplier: SupplierDTO = {
      id: `sup-${Date.now()}`,
      merchantId,
      name: data.name,
      companyName: data.companyName || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      taxNumber: data.taxNumber || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    list.push(newSupplier);
    this.suppliersStore.set(merchantId, list);
    return newSupplier;
  }

  public async getWarehouses(merchantId: string): Promise<WarehouseDTO[]> {
    return this.warehousesStore.get(merchantId) || [];
  }

  public async createWarehouse(
    merchantId: string,
    data: { name: string; code: string; address?: string; phone?: string; isDefault?: boolean }
  ): Promise<WarehouseDTO> {
    const list = this.warehousesStore.get(merchantId) || [];

    const newWarehouse: WarehouseDTO = {
      id: `wh-${Date.now()}`,
      merchantId,
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address || null,
      phone: data.phone || null,
      isDefault: data.isDefault || false,
      createdAt: new Date().toISOString(),
    };

    list.push(newWarehouse);
    this.warehousesStore.set(merchantId, list);
    return newWarehouse;
  }

  // --- PRODUCTS & VARIANTS ---

  public async getProducts(merchantId: string): Promise<ProductDTO[]> {
    return this.productsStore.get(merchantId) || [];
  }

  /**
   * Creates a product with SKU generation, barcode assignment, and optional variant options.
   */
  public async createProduct(
    merchantId: string,
    payload: CreateProductPayload
  ): Promise<ProductDTO> {
    const list = this.productsStore.get(merchantId) || [];
    const productId = `prod-${Date.now()}`;
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const createdVariants: ProductVariantDTO[] = [];

    if (payload.isVariant && payload.variants && payload.variants.length > 0) {
      payload.variants.forEach((v, idx) => {
        const sku = `SKU-${slug.substring(0, 6).toUpperCase()}-${idx + 101}`;
        const barcodeInfo = barcodeService.generateBarcodePayload(sku);

        createdVariants.push({
          id: `var-${Date.now()}-${idx}`,
          productId,
          sku,
          barcode: barcodeInfo.barcodeValue,
          qrCodeUrl: barcodeInfo.qrCodeDataUrl,
          variantName: v.variantName,
          costPrice: v.costPrice || payload.costPrice,
          sellingPrice: v.sellingPrice || payload.sellingPrice,
          attributes: v.attributes,
          createdAt: new Date().toISOString(),
        });
      });
    } else {
      // Single Variant product
      const sku = `SKU-${slug.substring(0, 8).toUpperCase()}-DEFAULT`;
      const barcodeInfo = barcodeService.generateBarcodePayload(sku);

      createdVariants.push({
        id: `var-${Date.now()}-default`,
        productId,
        sku,
        barcode: barcodeInfo.barcodeValue,
        qrCodeUrl: barcodeInfo.qrCodeDataUrl,
        variantName: 'Default Variant',
        costPrice: payload.costPrice,
        sellingPrice: payload.sellingPrice,
        attributes: { default: 'true' },
        createdAt: new Date().toISOString(),
      });
    }

    const newProduct: ProductDTO = {
      id: productId,
      merchantId,
      categoryId: payload.categoryId || null,
      brandId: payload.brandId || null,
      supplierId: payload.supplierId || null,
      name: payload.name,
      slug,
      description: payload.description || null,
      basePrice: payload.basePrice,
      costPrice: payload.costPrice,
      sellingPrice: payload.sellingPrice,
      isVariant: !!payload.isVariant,
      isActive: true,
      variants: createdVariants,
      createdAt: new Date().toISOString(),
    };

    list.push(newProduct);
    this.productsStore.set(merchantId, list);
    return newProduct;
  }

  private seedDemoCatalog(): void {
    const demoId = 'merch-techstore';

    this.categoriesStore.set(demoId, [
      { id: 'cat-1', merchantId: demoId, name: 'Smartphones & Accessories', slug: 'smartphones', isActive: true },
      { id: 'cat-2', merchantId: demoId, name: 'Laptops & Computers', slug: 'laptops', isActive: true },
    ]);

    this.brandsStore.set(demoId, [
      { id: 'brand-1', merchantId: demoId, name: 'Apple Bangladesh', slug: 'apple', isActive: true },
      { id: 'brand-2', merchantId: demoId, name: 'Samsung BD', slug: 'samsung', isActive: true },
    ]);

    this.suppliersStore.set(demoId, [
      { id: 'sup-1', merchantId: demoId, name: 'Smart Technologies BD', phone: '+8801711002233', isActive: true },
    ]);

    this.warehousesStore.set(demoId, [
      { id: 'wh-main', merchantId: demoId, name: 'Dhaka Central Warehouse', code: 'WH-DAC-01', isDefault: true },
    ]);
  }
}

export const catalogService = CatalogService.getInstance();
