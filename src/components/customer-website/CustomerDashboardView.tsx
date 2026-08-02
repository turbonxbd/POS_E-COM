import React, { useState } from 'react';
import { CustomerAddressDTO, CustomerWishlistDTO, StoreCustomerDTO } from '../../types/customer-website.types';
import { CustomerOrderSummary } from '../../features/customer-website/services/customer-account.service';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface CustomerDashboardViewProps {
  customer: StoreCustomerDTO;
  orders: CustomerOrderSummary[];
  wishlist: CustomerWishlistDTO[];
  onDownloadInvoice: (orderId: string) => void;
  onRemoveWishlist: (variantId: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  customer,
  orders,
  wishlist,
  onDownloadInvoice,
  onRemoveWishlist,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Header Banner */}
      <Card className="p-6 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center font-extrabold text-xl text-white shadow-inner">
            👤
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{customer.name}</h1>
            <p className="text-xs text-slate-400">
              {customer.phone} • {customer.email || 'No email registered'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-800 px-3 py-2 rounded-xl text-center">
            <span className="text-slate-400 block text-[10px]">Total Orders</span>
            <span className="font-extrabold text-white text-sm">{orders.length}</span>
          </div>
          <div className="bg-slate-800 px-3 py-2 rounded-xl text-center">
            <span className="text-slate-400 block text-[10px]">Wishlist Items</span>
            <span className="font-extrabold text-white text-sm">{wishlist.length}</span>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-all ${
            activeTab === 'orders'
              ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          My Orders ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 transition-all ${
            activeTab === 'wishlist'
              ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Saved Wishlist ({wishlist.length})
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <span className="text-4xl">📦</span>
              <p className="font-bold text-slate-600 mt-2">No orders placed yet</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Order #</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Recipient</th>
                  <th className="py-3 px-2">Grand Total</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-blue-600">{ord.orderNumber}</td>
                    <td className="py-3 px-2 text-slate-600">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{ord.recipientName}</td>
                    <td className="py-3 px-2 font-extrabold text-emerald-600">
                      ৳{ord.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="info" className="text-[10px]">
                        {ord.currentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onDownloadInvoice(ord.id)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        🖨️ PDF Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Wishlist Tab Content */}
      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {wishlist.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
              <span className="text-4xl">❤️</span>
              <p className="font-bold text-slate-600 mt-2">Your wishlist is empty</p>
            </div>
          ) : (
            wishlist.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.productName}</h4>
                  <p className="text-[11px] text-slate-500">{item.variantName}</p>
                  <div className="text-xs font-bold text-emerald-600 mt-1">
                    ৳{(item.unitPrice || 1500).toLocaleString()}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemoveWishlist(item.variantId)}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50 py-1 px-2.5"
                >
                  Remove
                </Button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
