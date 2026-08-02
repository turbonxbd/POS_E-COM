export type OrderTrackingStatusType =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type StorefrontPaymentMethodType = 'COD' | 'BKASH' | 'NAGAD' | 'CARD';

export type ProductSortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popular';

export interface StorefrontProductFilter {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: ProductSortOption;
  inStockOnly?: boolean;
  attributes?: Record<string, string[]>;
  page?: number;
  limit?: number;
}

export interface StorefrontCartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  stockAvailable: number;
  lineTotal: number;
}

export interface CartState {
  items: StorefrontCartItem[];
  couponCode?: string | null;
  discountAmount: number;
  shippingFee: number;
  subtotal: number;
  grandTotal: number;
  itemCount: number;
}

export interface CheckoutFormPayload {
  merchantId: string;
  customerId?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  division: string;
  district: string;
  addressDetails: string;
  paymentMethod: StorefrontPaymentMethodType;
  deliveryInstructions?: string | null;
  cartItems: StorefrontCartItem[];
  couponCode?: string | null;
}

export interface OrderTrackingLogDTO {
  id: string;
  orderId: string;
  status: OrderTrackingStatusType;
  statusNote?: string | null;
  updatedBy: string;
  createdAt: string;
}

export interface OrderTrackingResponse {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderTrackingStatusType;
  estimatedDeliveryDate?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  trackingLogs: OrderTrackingLogDTO[];
}

export interface ProductReviewDTO {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  orderId?: string | null;
  rating: number; // 1 to 5
  reviewText: string;
  images?: string[] | null;
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // e.g. { 5: 10, 4: 2, 3: 1, 2: 0, 1: 0 }
  reviews: ProductReviewDTO[];
}

export interface CustomerAddressDTO {
  id: string;
  customerId: string;
  addressTitle: string; // 'Home' | 'Office'
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  addressDetails: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerWishlistDTO {
  id: string;
  customerId: string;
  variantId: string;
  productName?: string;
  variantName?: string;
  imageUrl?: string | null;
  unitPrice?: number;
  createdAt?: string;
}

export interface StoreCustomerDTO {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  email?: string | null;
  isVerified: boolean;
  defaultAddress?: CustomerAddressDTO | null;
  addresses?: CustomerAddressDTO[];
  wishlists?: CustomerWishlistDTO[];
  createdAt?: string;
  updatedAt?: string;
}
