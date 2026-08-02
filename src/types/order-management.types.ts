export type CourierProviderType =
  | 'STEADFAST'
  | 'PATHAO'
  | 'PAPERFLY'
  | 'REDX'
  | 'MANUAL';

export type UnifiedOrderStatusType =
  | 'PENDING'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export type OrderSourceType = 'ONLINE' | 'POS';

export interface OrderFilterParams {
  merchantId?: string;
  status?: UnifiedOrderStatusType;
  source?: OrderSourceType;
  courierProvider?: CourierProviderType;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CourierConsignmentPayload {
  orderId: string;
  merchantId: string;
  courierProvider: CourierProviderType;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientDistrict: string;
  codAmount: number;
  deliveryFee: number;
  specialInstruction?: string | null;
  itemDescription?: string;
}

export interface CourierStatusSyncResponse {
  orderId: string;
  consignmentId: string;
  trackingCode: string;
  courierStatus: string;
  mappedOrderStatus: UnifiedOrderStatusType;
  deliveryFee: number;
  codAmount: number;
  lastSyncedAt: string;
}

export interface OrderStatusUpdateDTO {
  orderId: string;
  previousStatus: UnifiedOrderStatusType;
  newStatus: UnifiedOrderStatusType;
  changedBy: string; // User ID or 'SYSTEM'
  note?: string | null;
  updatedAt?: string;
}

export interface OrderInvoiceData {
  id: string;
  orderId: string;
  merchantId: string;
  invoiceNumber: string;
  pdfUrl?: string | null;
  isPrinted: boolean;
  generatedAt: string;
}

export interface OrderCourierMappingDTO {
  id: string;
  orderId: string;
  merchantId: string;
  courierProvider: CourierProviderType;
  consignmentId?: string | null;
  trackingCode?: string | null;
  deliveryFee: number;
  codAmount: number;
  courierStatus?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
}

export interface UnifiedOrderItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface UnifiedOrderDTO {
  id: string;
  orderNumber: string;
  merchantId: string;
  source: OrderSourceType;
  customerId?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  shippingAddress: string;
  division?: string;
  district?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  paymentMethod: string;
  currentStatus: UnifiedOrderStatusType;
  courierMapping?: OrderCourierMappingDTO | null;
  invoice?: OrderInvoiceData | null;
  items: UnifiedOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_FLOW: Record<UnifiedOrderStatusType, UnifiedOrderStatusType[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED', 'CANCELLED'],
  DELIVERED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
};

export const COURIER_PROVIDERS_LIST: { id: CourierProviderType; name: string; isAPIIntegrated: boolean }[] = [
  { id: 'STEADFAST', name: 'Steadfast Courier API', isAPIIntegrated: true },
  { id: 'PATHAO', name: 'Pathao Courier API', isAPIIntegrated: true },
  { id: 'PAPERFLY', name: 'Paperfly GO API', isAPIIntegrated: true },
  { id: 'REDX', name: 'RedX Logistics API', isAPIIntegrated: true },
  { id: 'MANUAL', name: 'Manual / Self Delivery', isAPIIntegrated: false },
];
