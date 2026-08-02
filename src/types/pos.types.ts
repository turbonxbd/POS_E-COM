export type POSSessionStatusType = 'OPEN' | 'CLOSED';

export type POSPaymentStatusType = 'PAID' | 'PARTIAL' | 'DUE';

export type POSFulfillmentStatusType = 'COMPLETED' | 'REFUNDED' | 'EXCHANGED';

export type POSPaymentMethodType =
  | 'CASH'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'CARD'
  | 'DUE';

export interface POSCartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode?: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  taxRate: number;
  lineTotal: number;
}

export interface POSPaymentSplit {
  paymentMethod: POSPaymentMethodType;
  amount: number;
  transactionReference?: string | null;
}

export interface HoldSalePayload {
  id?: string;
  merchantId: string;
  registerId: string;
  cashierId: string;
  customerId?: string | null;
  customerName?: string | null;
  cartItems: POSCartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  holdNote?: string | null;
  createdAt?: string;
}

export interface CashRegisterSummary {
  sessionId: string;
  registerId: string;
  registerName: string;
  openedAt: string;
  cashierName: string;
  openingBalance: number;
  totalCashSales: number;
  totalDigitalSales: number;
  totalDueSales: number;
  totalRefunds: number;
  expectedCashInDrawer: number;
  actualCashInDrawer: number;
  cashDifference: number;
  totalTransactions: number;
  status: POSSessionStatusType;
}

export interface ShortcutConfig {
  key: string;
  action: string;
  description: string;
  isCustomizable: boolean;
}

export interface POSRegisterDTO {
  id: string;
  merchantId: string;
  name: string;
  locationName?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface POSSessionDTO {
  id: string;
  registerId: string;
  cashierId: string;
  openingBalance: number;
  closingBalance?: number | null;
  expectedCash?: number | null;
  actualCash?: number | null;
  cashDifference?: number | null;
  status: POSSessionStatusType;
  openedAt: string;
  closedAt?: string | null;
  register?: POSRegisterDTO;
  cashierName?: string;
}

export interface POSHoldSaleDTO {
  id: string;
  merchantId: string;
  registerId: string;
  cashierId: string;
  customerId?: string | null;
  cartData: HoldSalePayload | POSCartItem[] | Record<string, unknown>;
  holdNote?: string | null;
  createdAt?: string;
}

export interface POSPaymentDTO {
  id: string;
  posOrderId: string;
  paymentMethod: POSPaymentMethodType;
  amount: number;
  transactionReference?: string | null;
  createdAt?: string;
}

export interface POSOrderDTO {
  id: string;
  merchantId: string;
  registerId: string;
  sessionId: string;
  cashierId: string;
  customerId?: string | null;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: POSPaymentStatusType;
  fulfillmentStatus: POSFulfillmentStatusType;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  payments?: POSPaymentDTO[];
  registerName?: string;
  cashierName?: string;
}

export interface POSRefundItem {
  variantId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string;
}

export interface POSRefundExchangeDTO {
  id: string;
  originalOrderId: string;
  newOrderId?: string | null;
  refundedAmount: number;
  reason: string;
  items: POSRefundItem[] | Record<string, unknown>;
  processedBy: string;
  processorName?: string;
  createdAt?: string;
}

export const DEFAULT_POS_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'F1',
    action: 'FOCUS_SEARCH',
    description: 'Focus barcode / product search input',
    isCustomizable: false,
  },
  {
    key: 'F2',
    action: 'HOLD_SALE',
    description: 'Hold current cart sale',
    isCustomizable: true,
  },
  {
    key: 'F3',
    action: 'RECALL_HOLD_SALE',
    description: 'View held sales list',
    isCustomizable: true,
  },
  {
    key: 'F4',
    action: 'QUICK_PAY_CASH',
    description: 'Instant checkout with exact cash',
    isCustomizable: true,
  },
  {
    key: 'F8',
    action: 'SPLIT_PAYMENT',
    description: 'Open multi-payment modal',
    isCustomizable: true,
  },
  {
    key: 'F9',
    action: 'APPLY_DISCOUNT',
    description: 'Apply cart or item level discount',
    isCustomizable: true,
  },
  {
    key: 'Escape',
    action: 'CLEAR_CART',
    description: 'Clear active cart items',
    isCustomizable: false,
  },
];

export const POS_PAYMENT_METHODS_LIST: { label: string; value: POSPaymentMethodType }[] = [
  { label: 'Cash', value: 'CASH' },
  { label: 'bKash', value: 'BKASH' },
  { label: 'Nagad', value: 'NAGAD' },
  { label: 'Rocket', value: 'ROCKET' },
  { label: 'Credit/Debit Card', value: 'CARD' },
  { label: 'Due / On Account', value: 'DUE' },
];
