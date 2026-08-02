export type TimeframeType = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR';

export type OrderChannelType = 'ONLINE' | 'POS';

export type PaymentStatusType = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export type FulfillmentStatusType = 'DELIVERED' | 'PROCESSING' | 'SHIPPED' | 'CANCELLED';

export interface KPIMetric {
  value: number;
  formattedValue: string;
  previousValue: number;
  growthPercentage: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface DashboardKPIs {
  totalSales: KPIMetric;
  totalRevenue: KPIMetric;
  totalOrders: KPIMetric;
  activeCustomers: KPIMetric;
  averageOrderValue: KPIMetric;
  currency: string;
}

export interface SalesChartPoint {
  timeLabel: string;
  onlineSales: number;
  posSales: number;
  totalSales: number;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  channel: OrderChannelType;
  totalAmount: number;
  paymentStatus: PaymentStatusType;
  fulfillmentStatus: FulfillmentStatusType;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderThreshold: number;
  unit: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'SUCCESS';
  timestamp: string;
  isRead: boolean;
}
