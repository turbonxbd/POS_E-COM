import { DashboardNotification } from '../../../types/merchant-dashboard.types';

/**
 * Enterprise Service for Managing Merchant Store Notifications and System Event Alerts.
 */
export class DashboardNotificationService {
  private static instance: DashboardNotificationService | null = null;
  private notificationsStore: Map<string, DashboardNotification[]> = new Map();

  private constructor() {
    this.seedInitialNotifications();
  }

  public static getInstance(): DashboardNotificationService {
    if (!DashboardNotificationService.instance) {
      DashboardNotificationService.instance = new DashboardNotificationService();
    }
    return DashboardNotificationService.instance;
  }

  /**
   * Retrieves all notifications for a merchant store.
   */
  public async getNotifications(merchantId: string): Promise<DashboardNotification[]> {
    return this.notificationsStore.get(merchantId) || [];
  }

  /**
   * Pushes a new event notification alert.
   */
  public async pushNotification(
    merchantId: string,
    title: string,
    message: string,
    type: 'WARNING' | 'INFO' | 'SUCCESS'
  ): Promise<DashboardNotification> {
    const list = this.notificationsStore.get(merchantId) || [];

    const newNotif: DashboardNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    list.unshift(newNotif);
    this.notificationsStore.set(merchantId, list);
    return newNotif;
  }

  /**
   * Marks a specific notification as read.
   */
  public async markAsRead(merchantId: string, notificationId: string): Promise<boolean> {
    const list = this.notificationsStore.get(merchantId);
    if (!list) return false;

    const notif = list.find((n) => n.id === notificationId);
    if (!notif) return false;

    notif.isRead = true;
    this.notificationsStore.set(merchantId, list);
    return true;
  }

  /**
   * Marks all notifications for a merchant as read.
   */
  public async markAllAsRead(merchantId: string): Promise<boolean> {
    const list = this.notificationsStore.get(merchantId);
    if (!list) return false;

    list.forEach((n) => (n.isRead = true));
    this.notificationsStore.set(merchantId, list);
    return true;
  }

  /**
   * Clears all notifications for a merchant store.
   */
  public async clearNotifications(merchantId: string): Promise<boolean> {
    this.notificationsStore.set(merchantId, []);
    return true;
  }

  private seedInitialNotifications(): void {
    const demoId = 'merch-techstore';
    const seed: DashboardNotification[] = [
      {
        id: 'notif-101',
        title: 'New Online Order #ORD-98401',
        message: 'Received new order from Tanvir Hossain for ৳3,490.00 BDT.',
        type: 'SUCCESS',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        isRead: false,
      },
      {
        id: 'notif-102',
        title: 'Low Stock Alert',
        message: '3 products (T-Shirt, Headphone, Sneakers) are below reorder threshold.',
        type: 'WARNING',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        isRead: false,
      },
      {
        id: 'notif-103',
        title: 'Subscription Renewal Reminder',
        message: 'Your Professional Plan will renew in 240 days.',
        type: 'INFO',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        isRead: true,
      },
    ];

    this.notificationsStore.set(demoId, seed);
  }
}

export const dashboardNotificationService = DashboardNotificationService.getInstance();
