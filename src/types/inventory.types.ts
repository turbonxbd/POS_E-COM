export type TransferStatusType = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type AdjustmentTypeEnum = 'ADD' | 'SUBTRACT' | 'SET';

export type AdjustmentReasonEnum = 'DAMAGE' | 'LOSS' | 'CORRECT_COUNT' | 'EXPIRED';

export type POPaymentStatusType = 'UNPAID' | 'PARTIAL' | 'PAID';

export type POStatusType = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export type InventoryChangeTypeEnum =
  | 'PURCHASE'
  | 'SALE_ONLINE'
  | 'SALE_POS'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RETURN';

export interface CategoryDTO {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface BrandDTO {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface SupplierDTO {
  id: string;
  merchantId: string;
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface WarehouseDTO {
  id: string;
  merchantId: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export interface ProductVariantDTO {
  id: string;
  productId: string;
  sku: string;
  barcode?: string | null;
  qrCodeUrl?: string | null;
  variantName: string;
  costPrice: number;
  sellingPrice: number;
  attributes: Record<string, string>;
  createdAt?: string;
}

export interface ProductDTO {
  id: string;
  merchantId: string;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  costPrice: number;
  sellingPrice: number;
  isVariant: boolean;
  isActive: boolean;
  variants?: ProductVariantDTO[];
  createdAt?: string;
}

export interface InventoryStockDTO {
  id: string;
  warehouseId: string;
  variantId: string;
  quantity: number;
  reorderLevel: number;
  updatedAt?: string;
}

export interface StockTransferDTO {
  id: string;
  merchantId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatusType;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export interface StockAdjustmentDTO {
  id: string;
  merchantId: string;
  warehouseId: string;
  variantId: string;
  adjustmentType: AdjustmentTypeEnum;
  quantity: number;
  reason: AdjustmentReasonEnum;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export interface PurchaseOrderDTO {
  id: string;
  merchantId: string;
  supplierId: string;
  warehouseId: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: POPaymentStatusType;
  status: POStatusType;
  createdAt?: string;
}

export interface InventoryLogDTO {
  id: string;
  merchantId: string;
  warehouseId: string;
  variantId: string;
  changeType: InventoryChangeTypeEnum;
  quantityChanged: number;
  quantityAfter: number;
  referenceId?: string | null;
  createdAt?: string;
}
