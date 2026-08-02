import React from 'react';
import { POSCartItem, POSOrderDTO } from '../../types/pos.types';

export interface ThermalReceiptProps {
  order: POSOrderDTO;
  cartItems: POSCartItem[];
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  vatRegNo?: string;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  cartItems,
  storeName = 'TECHSTORE BANGLADESH LTD.',
  storeAddress = 'Level 4, Multiplan Center, Elephant Road, Dhaka',
  storePhone = '+880 1711-002233',
  vatRegNo = 'BIN: 002991019-0101',
}) => {
  return (
    <div className="hidden print:block print:w-[80mm] print:mx-auto font-mono text-[11px] text-black bg-white p-2 leading-tight select-none">
      {/* Receipt Header */}
      <div className="text-center pb-2 border-b border-black border-dashed">
        <h2 className="font-bold text-sm uppercase tracking-wide">{storeName}</h2>
        <p className="text-[10px] mt-0.5">{storeAddress}</p>
        <p className="text-[10px]">Tel: {storePhone}</p>
        <p className="text-[10px] mt-0.5 font-bold">{vatRegNo}</p>
      </div>

      {/* Invoice Meta */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Invoice No:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(order.createdAt || Date.now()).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{order.cashierName || 'Rahim (POS-01)'}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{order.customerId || 'Walk-in Customer'}</span>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="py-2 border-b border-black border-dashed">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black text-[10px]">
              <th className="py-0.5 font-bold">Item</th>
              <th className="py-0.5 text-center font-bold">Qty</th>
              <th className="py-0.5 text-right font-bold">Price</th>
              <th className="py-0.5 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-1 max-w-[120px] truncate">
                  {item.productName}
                  {item.variantName !== 'Default Variant' && (
                    <span className="block text-[9px] text-slate-700">[{item.variantName}]</span>
                  )}
                </td>
                <td className="py-1 text-center font-bold">{item.quantity}</td>
                <td className="py-1 text-right">৳{item.unitPrice}</td>
                <td className="py-1 text-right font-bold">৳{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Breakdown */}
      <div className="py-2 border-b border-black border-dashed space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>৳{order.subtotal.toLocaleString()}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-৳{order.discountAmount.toLocaleString()}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>VAT / Tax:</span>
            <span>৳{order.taxAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
          <span>GRAND TOTAL:</span>
          <span>৳{order.grandTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid Amount:</span>
          <span>৳{order.paidAmount.toLocaleString()}</span>
        </div>
        {order.dueAmount > 0 ? (
          <div className="flex justify-between font-bold text-black">
            <span>DUE BALANCE:</span>
            <span>৳{order.dueAmount.toLocaleString()}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>Change Due:</span>
            <span>৳{Math.max(0, order.paidAmount - order.grandTotal).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Payment Split Breakdown */}
      {order.payments && order.payments.length > 0 && (
        <div className="py-1.5 border-b border-black border-dashed text-[10px]">
          <span className="font-bold block mb-0.5">Payment Method(s):</span>
          {order.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{p.paymentMethod}</span>
              <span>৳{p.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer / QR / Barcode Lookup */}
      <div className="text-center pt-3 space-y-1">
        <div className="font-bold text-[10px] uppercase tracking-widest">{order.orderNumber}</div>
        <p className="text-[9px]">Goods sold are returnable within 7 days with original invoice receipt.</p>
        <p className="text-[10px] font-bold mt-1">*** THANK YOU FOR SHOPPING WITH US! ***</p>
      </div>
    </div>
  );
};
