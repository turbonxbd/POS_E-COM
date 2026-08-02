import React, { useState } from 'react';
import {
  CourierProviderType,
  OrderStatusUpdateDTO,
  UnifiedOrderDTO,
  UnifiedOrderStatusType,
} from '../../types/order-management.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface OrderDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: UnifiedOrderDTO | null;
  historyLogs?: OrderStatusUpdateDTO[];
  onUpdateStatus: (newStatus: UnifiedOrderStatusType, note?: string) => Promise<void>;
  onDispatchCourier: (provider: CourierProviderType, weight: number, instruction: string) => Promise<void>;
  onPrintInvoice: (orderId: string) => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  isOpen,
  onClose,
  order,
  historyLogs = [],
  onUpdateStatus,
  onDispatchCourier,
  onPrintInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'dispatch' | 'timeline'>('summary');
  const [selectedProvider, setSelectedProvider] = useState<CourierProviderType>('STEADFAST');
  const [parcelWeight, setParcelWeight] = useState<number>(0.5);
  const [specialInstruction, setSpecialInstruction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>('');

  if (!isOpen || !order) return null;

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onDispatchCourier(selectedProvider, parcelWeight, specialInstruction);
      alert(`Order #${order.orderNumber} successfully dispatched via ${selectedProvider}!`);
    } catch (err: any) {
      alert(err.message || 'Dispatch failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdateSubmit = async (newStatus: UnifiedOrderStatusType) => {
    try {
      setIsSubmitting(true);
      await onUpdateStatus(newStatus, statusNote);
      setStatusNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight">{order.orderNumber}</h2>
                <Badge variant="info" className="text-[10px]">
                  {order.source}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onPrintInvoice(order.id)}
                className="text-xs py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
              >
                🖨️ Invoice PDF
              </Button>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg p-1">
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`py-2.5 transition-colors ${
                activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Summary & Products
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`py-2.5 transition-colors ${
                activeTab === 'dispatch' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              🚚 Dispatch Courier
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 transition-colors ${
                activeTab === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              📜 Timeline Audit
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                {/* Order Status Action Controls */}
                <Card className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Current Status:</span>
                    <Badge variant="info">{order.currentStatus}</Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Optional status note..."
                      className="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs"
                    />
                    <select
                      disabled={isSubmitting}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleStatusUpdateSubmit(e.target.value as UnifiedOrderStatusType);
                          e.target.value = '';
                        }
                      }}
                      className="border border-slate-300 rounded px-2 py-1 text-xs font-bold bg-white"
                    >
                      <option value="">Update Status...</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PACKED">PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </Card>

                {/* Recipient & Shipping Information */}
                <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📍</span> Recipient Delivery Info
                  </h4>
                  <div className="text-slate-700 leading-relaxed">
                    Name: <strong>{order.recipientName}</strong><br />
                    Phone: <strong className="font-mono">{order.recipientPhone}</strong><br />
                    Address: {order.shippingAddress}<br />
                    {order.district && <span>District: {order.district}, {order.division}</span>}
                  </div>
                </Card>

                {/* Itemized Products Table */}
                <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900">Ordered Products Checklist</h4>
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <div key={item.variantId} className="py-2 first:pt-0 flex items-center justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900">{item.productName}</h5>
                          <p className="text-[11px] text-slate-500 font-mono">
                            SKU: {item.sku} | Variant: {item.variantName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">৳{item.lineTotal.toLocaleString()}</div>
                          <span className="text-[11px] text-slate-500">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Financial Summary */}
                <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>৳{order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-৳{order.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee</span>
                    <span>৳{order.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
                    <span>Grand Total</span>
                    <span className="text-emerald-600">৳{order.grandTotal.toLocaleString()} BDT</span>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'dispatch' && (
              <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
                <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🚚</span> Parcel Dispatch Configuration
                  </h4>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Courier Partner *</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as CourierProviderType)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold bg-slate-50"
                    >
                      <option value="STEADFAST">Steadfast Courier API</option>
                      <option value="PATHAO">Pathao Courier API</option>
                      <option value="PAPERFLY">Paperfly GO API</option>
                      <option value="REDX">RedX Logistics API</option>
                      <option value="MANUAL">Manual / Self Delivery</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Estimated Weight (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parcelWeight}
                        onChange={(e) => setParcelWeight(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">COD Amount (BDT)</label>
                      <input
                        type="number"
                        disabled
                        value={order.dueAmount}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-slate-100 text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Instruction for Driver</label>
                    <input
                      type="text"
                      value={specialInstruction}
                      onChange={(e) => setSpecialInstruction(e.target.value)}
                      placeholder="e.g. Fragile glass item, call customer before delivery"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full py-2.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                  >
                    {isSubmitting ? 'Dispatching...' : `Dispatch to ${selectedProvider} →`}
                  </Button>
                </Card>
              </form>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Order Status History Audit Log</h4>
                <div className="space-y-3 divide-y divide-slate-100">
                  {historyLogs.map((log, i) => (
                    <div key={i} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {log.previousStatus} → <span className="text-blue-600">{log.newStatus}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.updatedAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.note}</p>
                      <div className="text-[10px] text-slate-400">Changed By: {log.changedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
