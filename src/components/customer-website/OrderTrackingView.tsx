import React, { useState } from 'react';
import { PublicOrderTrackingResult } from '../../features/customer-website/services/tracking.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export interface OrderTrackingViewProps {
  onTrackSubmit: (orderNumber: string, phone: string) => Promise<PublicOrderTrackingResult>;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ onTrackSubmit }) => {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<PublicOrderTrackingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim() || !phoneInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await onTrackSubmit(orderNumberInput.trim(), phoneInput.trim());
      setTrackingResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Order tracking lookup failed.');
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900">🚚 Track Your Order</h1>
        <p className="text-xs text-slate-500">
          Enter your Order Number and Customer Phone Number to view live delivery status.
        </p>
      </div>

      {/* Lookup Form */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Order Number *</label>
            <input
              type="text"
              required
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder="e.g. ORD-20260801-9901"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. +8801700112233"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-2.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              {isLoading ? 'Searching...' : 'Track Live Order'}
            </Button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
      </Card>

      {/* Visual Tracking Progress Timeline */}
      {trackingResult && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-sm">
          {/* Header Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Order #{trackingResult.orderNumber}
                </h3>
                <Badge variant="info">{trackingResult.currentStatus}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recipient: <span className="font-semibold text-slate-800">{trackingResult.recipientName}</span>
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Est. Delivery Date</div>
              <div className="font-bold text-xs text-blue-600">
                {new Date(trackingResult.estimatedDeliveryDate || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Visual 4-Step Timeline */}
          <div className="py-4">
            <div className="grid grid-cols-4 gap-2 relative">
              {[
                { step: 1, title: 'Order Placed', desc: 'Received by store' },
                { step: 2, title: 'Processing', desc: 'Packing in warehouse' },
                { step: 3, title: 'Shipped', desc: 'Handed to courier' },
                { step: 4, title: 'Delivered', desc: 'Arrived at destination' },
              ].map((s) => {
                const currentStepIndex = getStatusStepIndex(trackingResult.currentStatus);
                const isCompleted = currentStepIndex >= s.step;

                return (
                  <div key={s.step} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        isCompleted ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? '✓' : s.step}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>📦</span>
              <span>Courier Shipment Details:</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Courier Partner:</span>
              <span className="font-bold text-slate-900">{trackingResult.courierName || 'Steadfast Courier'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tracking Code:</span>
              <span className="font-mono font-bold text-blue-600">{trackingResult.courierTrackingId}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
