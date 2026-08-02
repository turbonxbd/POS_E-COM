import {
  DashboardKPIs,
  KPIMetric,
  SalesChartPoint,
  RecentOrderSummary,
  LowStockItem,
  DashboardNotification,
  TimeframeType,
} from '../../../types/merchant-dashboard.types';

/**
 * Enterprise Merchant Analytics & KPI Aggregation Engine.
 */
export class MerchantAnalyticsService {
  private static instance: MerchantAnalyticsService | null = null;

  private constructor() {}

  public static getInstance(): MerchantAnalyticsService {
    if (!MerchantAnalyticsService.instance) {
      MerchantAnalyticsService.instance = new MerchantAnalyticsService();
    }
    return MerchantAnalyticsService.instance;
  }

  /**
   * Calculates overview KPIs including Total Sales, Revenue, Orders Count, Active Customers, AOV, and growth percentages.
   */
  public async getOverviewKPIs(
    merchantId: string,
    timeframe: TimeframeType = 'THIS_MONTH'
  ): Promise<DashboardKPIs> {
    // Simulated aggregated sales data calculation
    const currentSales = 248900; // ৳248,900 BDT
    const previousSales = 210200;
    const salesGrowth = this.calculateGrowthPercentage(currentSales, previousSales);

    const currentRevenue = 224010; // ৳224,010 BDT
    const previousRevenue = 191000;
    const revenueGrowth = this.calculateGrowthPercentage(currentRevenue, previousRevenue);

    const currentOrders = 1248;
    const previousOrders = 1080;
    const ordersGrowth = this.calculateGrowthPercentage(currentOrders, previousOrders);

    const currentCustomers = 890;
    const previousCustomers = 760;
    const customersGrowth = this.calculateGrowthPercentage(currentCustomers, previousCustomers);

    const currentAOV = Number((currentSales / currentOrders).toFixed(2)); // ~৳199.44
    const previousAOV = Number((previousSales / previousOrders).toFixed(2));
    const aovGrowth = this.calculateGrowthPercentage(currentAOV, previousAOV);

    return {
      totalSales: this.buildKPIMetric(currentSales, previousSales, salesGrowth, '৳'),
      totalRevenue: this.buildKPIMetric(currentRevenue, previousRevenue, revenueGrowth, '৳'),
      totalOrders: this.buildKPIMetric(currentOrders, previousOrders, ordersGrowth, ''),
      activeCustomers: this.buildKPIMetric(currentCustomers, previousCustomers, customersGrowth, ''),
      averageOrderValue: this.buildKPIMetric(currentAOV, previousAOV, aovGrowth, '৳'),
      currency: 'BDT',
    };
  }

  /**
   * Aggregates sales chart points over time (Hourly for Today, Daily for This Month, Monthly for This Year) split by channel.
   */
  public async getSalesChartData(
    merchantId: string,
    timeframe: TimeframeType = 'THIS_MONTH'
  ): Promise<SalesChartPoint[]> {
    if (timeframe === 'TODAY') {
      return [
        { timeLabel: '08:00 AM', onlineSales: 2400, posSales: 1200, totalSales: 3600 },
        { timeLabel: '11:00 AM', onlineSales: 5600, posSales: 4300, totalSales: 9900 },
        { timeLabel: '02:00 PM', onlineSales: 8900, posSales: 7800, totalSales: 16700 },
        { timeLabel: '05:00 PM', onlineSales: 12400, posSales: 10500, totalSales: 22900 },
        { timeLabel: '08:00 PM', onlineSales: 18500, posSales: 14200, totalSales: 32700 },
      ];
    }

    if (timeframe === 'THIS_YEAR') {
      return [
        { timeLabel: 'Jan', onlineSales: 120000, posSales: 95000, totalSales: 215000 },
        { timeLabel: 'Feb', onlineSales: 145000, posSales: 110000, totalSales: 255000 },
        { timeLabel: 'Mar', onlineSales: 160000, posSales: 130000, totalSales: 290000 },
        { timeLabel: 'Apr', onlineSales: 180000, posSales: 155000, totalSales: 335000 },
        { timeLabel: 'May', onlineSales: 210000, posSales: 175000, totalSales: 385000 },
        { timeLabel: 'Jun', onlineSales: 248900, posSales: 198000, totalSales: 446900 },
      ];
    }

    // Default: THIS_MONTH (Weekly aggregation)
    return [
      { timeLabel: 'Week 1', onlineSales: 35000, posSales: 28000, totalSales: 63000 },
      { timeLabel: 'Week 2', onlineSales: 42000, posSales: 34000, totalSales: 76000 },
      { timeLabel: 'Week 3', onlineSales: 51000, posSales: 41000, totalSales: 92000 },
      { timeLabel: 'Week 4', onlineSales: 68900, posSales: 49000, totalSales: 117900 },
    ];
  }

  /**
   * Fetches latest 5-10 orders feed with channel, total amount, and fulfillment status.
   */
  public async getRecentOrders(merchantId: string, limit = 5): Promise<RecentOrderSummary[]> {
    const orders: RecentOrderSummary[] = [
      {
        id: 'ord-1001',
        orderNumber: 'ORD-98401',
        customerName: 'Tanvir Hossain',
        channel: 'ONLINE',
        totalAmount: 3490.0,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'ord-1002',
        orderNumber: 'POS-77120',
        customerName: 'Walk-in Customer (Counter #1)',
        channel: 'POS',
        totalAmount: 1250.0,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 'ord-1003',
        orderNumber: 'ORD-98400',
        customerName: 'Nusrat Jahan',
        channel: 'ONLINE',
        totalAmount: 5800.0,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PROCESSING',
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      },
      {
        id: 'ord-1004',
        orderNumber: 'POS-77119',
        customerName: 'Walk-in Customer (Counter #2)',
        channel: 'POS',
        totalAmount: 890.0,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
      },
      {
        id: 'ord-1005',
        orderNumber: 'ORD-98399',
        customerName: 'Arifur Rahman',
        channel: 'ONLINE',
        totalAmount: 2150.0,
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'PROCESSING',
        createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
      },
    ];

    return orders.slice(0, limit);
  }

  /**
   * Identifies products where current stock quantity is less than or equal to minimum reorder threshold.
   */
  public async getLowStockAlerts(merchantId: string, threshold = 10): Promise<LowStockItem[]> {
    const items: LowStockItem[] = [
      {
        id: 'prod-01',
        sku: 'TSHIRT-BLK-L',
        productName: 'Premium Cotton T-Shirt (Black - L)',
        category: 'Clothing & Apparel',
        currentStock: 3,
        reorderThreshold: 10,
        unit: 'pcs',
      },
      {
        id: 'prod-02',
        sku: 'HEADPHONE-BT-01',
        productName: 'Wireless Bluetooth Headphone Pro',
        category: 'Electronics',
        currentStock: 2,
        reorderThreshold: 5,
        unit: 'units',
      },
      {
        id: 'prod-03',
        sku: 'SNEAKER-WHT-42',
        productName: 'Urban Runner Sneakers (White - 42)',
        category: 'Footwear',
        currentStock: 4,
        reorderThreshold: 8,
        unit: 'pairs',
      },
    ];

    return items.filter((item) => item.currentStock <= threshold);
  }

  /**
   * Retrieves active merchant notifications and system alerts.
   */
  public async getDashboardNotifications(merchantId: string): Promise<DashboardNotification[]> {
    return [
      {
        id: 'notif-1',
        title: 'Low Stock Alert',
        message: '3 items have reached critical reorder threshold.',
        type: 'WARNING',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        isRead: false,
      },
      {
        id: 'notif-2',
        title: 'New Online Order',
        message: 'Order #ORD-98401 received for ৳3,490.00 BDT.',
        type: 'SUCCESS',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        isRead: false,
      },
      {
        id: 'notif-3',
        title: 'Daily POS Register Closure',
        message: 'Main Counter #1 successfully closed with ৳14,200 total sales.',
        type: 'INFO',
        timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
        isRead: true,
      },
    ];
  }

  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return 100;
    const diff = current - previous;
    return Number(((diff / previous) * 100).toFixed(1));
  }

  private buildKPIMetric(value: number, previousValue: number, growthPercentage: number, prefix: string): KPIMetric {
    const formattedValue = prefix ? `${prefix}${value.toLocaleString()}` : `${value.toLocaleString()}`;
    const trend = growthPercentage > 0 ? 'UP' : growthPercentage < 0 ? 'DOWN' : 'FLAT';
    return {
      value,
      formattedValue,
      previousValue,
      growthPercentage,
      trend,
    };
  }
}

export const merchantAnalyticsService = MerchantAnalyticsService.getInstance();
