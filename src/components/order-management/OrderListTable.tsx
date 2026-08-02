import React from 'react';
import {
  CourierProviderType,
  OrderSourceType,
  UnifiedOrderDTO,
  UnifiedOrderStatusType,
} from '../../types/order-management.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface OrderListTableProps {
  orders: UnifiedOrderDTO[];
  selectedOrderIds: string[];
  onSelectOrderToggle: (orderId: string) => void;
  onSelectAllToggle: () => void;
  onViewOrderDetails: (order: UnifiedOrderDTO) => void;
  onTrackOrder: (order: UnifiedOrderDTO) => void;
  onPrintInvoice: (orderId: string) => void;
  onBulkStatusChange: (newStatus: UnifiedOrderStatusType) => void;
  onBulkDispatch: (provider: CourierProviderType) => void;
  onBulkPrintInvoices: (type: 'invoice' | 'packing_slip') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSource: OrderSourceType | 'ALL';
  onSourceChange: (source: OrderSourceType | 'ALL') => void;
  selectedPaymentStatus: string | 'ALL';
  onPaymentStatusChange: (status: string | 'ALL') => void;
}

export const OrderListTable: React.FC<OrderListTableProps> = ({
  orders,
  selectedOrderIds,
  onSelectOrderToggle,
  onSelectAllToggle,
  onViewOrderDetails,
  onTrackOrder,
  onPrintInvoice,
  onBulkStatusChange,
  onBulkDispatch,
  onBulkPrintInvoices,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedSource,
  onSourceChange,
  selectedPaymentStatus,
  onPaymentStatusChange,
}) => {
  const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;

  const tabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'ONLINE', label: '🌐 Online' },
    { id: 'POS', label: '🏪 POS' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'PACKED', label: 'Packed' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'RETURNED', label: 'Returned' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  const getStatusBadgeVariant = (status: UnifiedOrderStatusType) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'SHIPPED':
      case 'PACKED':
      case 'PROCESSING':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'RETURNED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-3 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Order #, Name, Phone..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-9 text-xs font-medium"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Source Dropdown */}
          <select
            value={selectedSource}
            onChange={(e) => onSourceChange(e.target.value as OrderSourceType | 'ALL')}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-slate-50"
          >
            <option value="ALL">All Channels</option>
            <option value="ONLINE">Online Storefront</option>
            <option value="POS">POS Terminal</option>
          </select>

          {/* Payment Status Dropdown */}
          <select
            value={selectedPaymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-slate-50"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="DUE">DUE</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar (Appears when checkboxes selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-900 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-fade-in">
          <div className="font-extrabold flex items-center gap-2">
            <span className="bg-blue-600 px-2 py-0.5 rounded-full text-[11px]">
              {selectedOrderIds.length} Selected
            </span>
            <span>Bulk Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Status Update */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusChange(e.target.value as UnifiedOrderStatusType);
                  e.target.value = '';
                }
              }}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1.5 text-xs font-bold"
            >
              <option value="">Update Status...</option>
              <option value="PROCESSING">Set to PROCESSING</option>
              <option value="PACKED">Set to PACKED</option>
              <option value="SHIPPED">Set to SHIPPED</option>
              <option value="DELIVERED">Set to DELIVERED</option>
              <option value="CANCELLED">Set to CANCELLED</option>
            </select>

            {/* Bulk Courier Dispatch */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onBulkDispatch('STEADFAST')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none py-1.5 px-3 text-xs font-bold"
            >
              🚚 Dispatch via Steadfast
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onBulkDispatch('PATHAO')}
              className="bg-red-600 hover:bg-red-700 text-white border-none py-1.5 px-3 text-xs font-bold"
            >
              🚚 Dispatch via Pathao
            </Button>

            {/* Bulk Print */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onBulkPrintInvoices('invoice')}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 py-1.5 px-3 text-xs font-bold"
            >
              🖨️ Print Invoices
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onBulkPrintInvoices('packing_slip')}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 py-1.5 px-3 text-xs font-bold"
            >
              📦 Packing Slips
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAllToggle}
                  className="rounded text-blue-600"
                />
              </th>
              <th className="p-3">Order # / Channel</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer details</th>
              <th className="p-3 text-center">Items</th>
              <th className="p-3 text-right">Grand Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Order Status</th>
              <th className="p-3">Courier Info</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">
                  No orders found matching current tab & filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const isChecked = selectedOrderIds.includes(ord.id);
                return (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onSelectOrderToggle(ord.id)}
                        className="rounded text-blue-600"
                      />
                    </td>

                    <td className="p-3 font-mono font-bold text-blue-600">
                      <div>{ord.orderNumber}</div>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">
                        {ord.source === 'ONLINE' ? '🌐 Online' : '🏪 POS Counter'}
                      </span>
                    </td>

                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{ord.recipientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ord.recipientPhone}</div>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-700">
                      {ord.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>

                    <td className="p-3 text-right font-extrabold text-emerald-600">
                      ৳{ord.grandTotal.toLocaleString()}
                    </td>

                    <td className="p-3">
                      <Badge
                        variant={
                          ord.paymentStatus === 'PAID'
                            ? 'success'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'warning'
                            : 'error'
                        }
                        className="text-[10px]"
                      >
                        {ord.paymentStatus} ({ord.paymentMethod})
                      </Badge>
                    </td>

                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(ord.currentStatus)} className="text-[10px]">
                        {ord.currentStatus}
                      </Badge>
                    </td>

                    <td className="p-3 text-[11px]">
                      {ord.courierMapping ? (
                        <div>
                          <span className="font-bold text-slate-800">{ord.courierMapping.courierProvider}</span>
                          <div className="text-blue-600 font-mono text-[10px]">
                            {ord.courierMapping.trackingCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Dispatched</span>
                      )}
                    </td>

                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onViewOrderDetails(ord)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        View
                      </Button>

                      {ord.courierMapping && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onTrackOrder(ord)}
                          className="text-[11px] py-1 px-2.5 text-blue-600 border-blue-200"
                        >
                          🚚 Track
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onPrintInvoice(ord.id)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        🖨️ PDF
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
