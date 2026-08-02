import React from 'react';
import { UnifiedOrderDTO } from '../../types/order-management.types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: UnifiedOrderDTO | null;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const mapping = order.courierMapping;
  const trackingCode = mapping?.trackingCode || 'TRK-BD-PENDING';
  const courierName = mapping?.courierProvider || 'Standard Delivery';

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PROCESSING':
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(order.currentStatus);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🚚 Courier Shipment Tracking - #${order.orderNumber}`}>
      <div className="space-y-6 text-xs select-none">
        {/* Courier & Consignment Banner */}
        <Card className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-xs text-slate-400">Courier Partner</div>
            <div className="text-sm font-extrabold text-white">{courierName}</div>
          </div>

          <div className="text-right">
            <div className="font-bold text-xs text-slate-400">Tracking Code</div>
            <div className="text-sm font-mono font-extrabold text-blue-400">{trackingCode}</div>
          </div>
        </Card>

        {/* Visual 4-Step Progress Bar */}
        <div className="py-2">
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { step: 1, title: 'Order Placed', desc: 'Received by store' },
              { step: 2, title: 'Warehouse', desc: 'Packed & ready' },
              { step: 3, title: 'Shipped', desc: 'In transit courier' },
              { step: 4, title: 'Delivered', desc: 'Arrived at customer' },
            ].map((s) => {
              const isCompleted = currentStep >= s.step;
              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? '✓' : s.step}
                  </div>
                  <h4 className="font-bold text-[11px] text-slate-900">{s.title}</h4>
                  <p className="text-[10px] text-slate-400 hidden sm:block">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Details Card */}
        <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="font-bold text-slate-800">Delivery Recipient Address:</div>
          <div className="text-slate-600">
            Name: <strong>{order.recipientName}</strong> | Phone: <strong className="font-mono">{order.recipientPhone}</strong><br />
            Address: {order.shippingAddress}, {order.district || ''}, {order.division || ''}
          </div>
        </Card>
      </div>
    </Modal>
  );
};
