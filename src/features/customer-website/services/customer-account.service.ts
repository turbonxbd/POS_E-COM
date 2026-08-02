import { CustomerAddressDTO, StoreCustomerDTO } from '../../../types/customer-website.types';

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  grandTotal: number;
  paymentMethod: string;
  currentStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  estimatedDeliveryDate: string;
  createdAt: string;
  itemCount: number;
}

/**
 * Enterprise Service for Customer Account Portal, Address Book CRUD, Order History, and PDF/HTML Invoice Generation.
 */
export class CustomerAccountService {
  private static instance: CustomerAccountService | null = null;

  // In-memory stores
  private customerProfiles: Map<string, StoreCustomerDTO> = new Map();
  private customerAddresses: Map<string, CustomerAddressDTO[]> = new Map();

  private constructor() {
    this.seedDemoAccountData();
  }

  public static getInstance(): CustomerAccountService {
    if (!CustomerAccountService.instance) {
      CustomerAccountService.instance = new CustomerAccountService();
    }
    return CustomerAccountService.instance;
  }

  /**
   * Retrieves customer account profile and default address.
   */
  public async getCustomerProfile(customerId: string): Promise<StoreCustomerDTO | null> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) return null;

    const addresses = this.customerAddresses.get(customerId) || [];
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

    return {
      ...profile,
      addresses,
      defaultAddress,
    };
  }

  /**
   * Updates customer profile fields.
   */
  public async updateProfile(
    customerId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<StoreCustomerDTO> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) {
      throw new Error(`Customer profile "${customerId}" not found.`);
    }

    const updated: StoreCustomerDTO = {
      ...profile,
      name: data.name || profile.name,
      phone: data.phone || profile.phone,
      email: data.email !== undefined ? data.email : profile.email,
      updatedAt: new Date().toISOString(),
    };

    this.customerProfiles.set(customerId, updated);
    return updated;
  }

  /**
   * Queries order history for a customer account.
   */
  public async getCustomerOrderHistory(customerId: string): Promise<CustomerOrderSummary[]> {
    return [
      {
        id: 'ord-demo-1001',
        orderNumber: 'ORD-20260801-9901',
        trackingNumber: 'TRK-BD-880192',
        recipientName: 'Karim Ahmed',
        recipientPhone: '+8801700112233',
        grandTotal: 2870,
        paymentMethod: 'COD',
        currentStatus: 'PROCESSING',
        estimatedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        itemCount: 2,
      },
    ];
  }

  /**
   * Generates printable HTML string for Customer E-Commerce Invoice rendering.
   */
  public async generateOrderInvoiceHTML(customerId: string, orderId: string): Promise<string> {
    const orders = await this.getCustomerOrderHistory(customerId);
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId) || orders[0];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.orderNumber} - TechStore BD</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; padding: 40px; background: #fff; }
    .invoice-box { max-width: 750px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
    .header { flex-direction: row; display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .brand-title { font-size: 22px; font-weight: 800; color: #2563eb; }
    .status-tag { padding: 4px 10px; background: #3b82f6; color: #fff; font-size: 11px; font-weight: bold; border-radius: 4px; }
    .info-grid { display: flex; justify-content: space-between; margin: 25px 0; font-size: 13px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 12px; font-weight: bold; }
    .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .totals { margin-top: 20px; text-align: right; font-size: 13px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="brand-title">TECHSTORE BANGLADESH</div>
        <div style="font-size: 11px; color: #64748b;">Official E-Commerce Storefront Invoice</div>
      </div>
      <div>
        <span class="status-tag">${order.currentStatus}</span>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <strong>Customer Delivery Address:</strong><br>
        Name: ${order.recipientName}<br>
        Phone: ${order.recipientPhone}<br>
        Address: House 42, Road 11, Banani, Dhaka
      </div>
      <div style="text-align: right;">
        <strong>Invoice Details:</strong><br>
        Invoice #: <strong>${order.orderNumber}</strong><br>
        Tracking #: <strong>${order.trackingNumber}</strong><br>
        Date: ${new Date(order.createdAt).toLocaleDateString()}<br>
        Payment Method: ${order.paymentMethod}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Total Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>iPhone 15 Pro Silicone Case (Black)</td>
          <td style="text-align: center;">2</td>
          <td style="text-align: right;">৳2,800.00</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: <strong>৳2,800.00</strong></div>
      <div>Shipping Fee (Dhaka): <strong>৳70.00</strong></div>
      <div style="font-size: 16px; font-weight: bold; color: #16a34a; margin-top: 6px;">
        Grand Total Payable: ৳${order.grandTotal.toLocaleString()} BDT
      </div>
    </div>

    <div class="footer">
      Thank you for shopping with TechStore BD! For helpline support, call +880 1711-002233.
    </div>
  </div>
</body>
</html>`;
  }

  // --- ADDRESS BOOK CRUD ---

  public async getCustomerAddresses(customerId: string): Promise<CustomerAddressDTO[]> {
    return this.customerAddresses.get(customerId) || [];
  }

  public async addAddress(
    customerId: string,
    payload: Omit<CustomerAddressDTO, 'id' | 'customerId'>
  ): Promise<CustomerAddressDTO> {
    const list = this.customerAddresses.get(customerId) || [];
    const addressId = `addr-${Date.now()}`;

    const newAddress: CustomerAddressDTO = {
      ...payload,
      id: addressId,
      customerId,
      isDefault: payload.isDefault || list.length === 0,
      createdAt: new Date().toISOString(),
    };

    if (newAddress.isDefault) {
      list.forEach((a) => (a.isDefault = false));
    }

    list.push(newAddress);
    this.customerAddresses.set(customerId, list);
    return newAddress;
  }

  public async updateAddress(
    customerId: string,
    addressId: string,
    payload: Partial<CustomerAddressDTO>
  ): Promise<CustomerAddressDTO> {
    const list = this.customerAddresses.get(customerId) || [];
    const index = list.findIndex((a) => a.id === addressId);

    if (index === -1) {
      throw new Error(`Address "${addressId}" not found.`);
    }

    if (payload.isDefault) {
      list.forEach((a) => (a.isDefault = false));
    }

    const updated: CustomerAddressDTO = {
      ...list[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.customerAddresses.set(customerId, list);
    return updated;
  }

  public async deleteAddress(customerId: string, addressId: string): Promise<boolean> {
    const list = this.customerAddresses.get(customerId) || [];
    const filtered = list.filter((a) => a.id !== addressId);
    if (filtered.length !== list.length) {
      this.customerAddresses.set(customerId, filtered);
      return true;
    }
    return false;
  }

  public async setDefaultAddress(customerId: string, addressId: string): Promise<void> {
    const list = this.customerAddresses.get(customerId) || [];
    list.forEach((a) => {
      a.isDefault = a.id === addressId;
    });
    this.customerAddresses.set(customerId, list);
  }

  private seedDemoAccountData(): void {
    const demoCustId = 'cust-101';

    this.customerProfiles.set(demoCustId, {
      id: demoCustId,
      merchantId: 'merch-techstore',
      name: 'Karim Ahmed',
      phone: '+8801700112233',
      email: 'karim@gmail.com',
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    this.customerAddresses.set(demoCustId, [
      {
        id: 'addr-101',
        customerId: demoCustId,
        addressTitle: 'Home',
        recipientName: 'Karim Ahmed',
        phone: '+8801700112233',
        division: 'Dhaka',
        district: 'Dhaka',
        addressDetails: 'House 42, Road 11, Banani',
        isDefault: true,
      },
    ]);
  }
}

export const customerAccountService = CustomerAccountService.getInstance();
