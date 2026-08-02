import React, { useState } from 'react';
import { POSCartItem } from '../../types/pos.types';
import { POSCustomerCacheItem } from '../../features/pos/offline/pos-db';
import { Button } from '../ui/Button';

export interface POSCartPanelProps {
  cartItems: POSCartItem[];
  onUpdateQuantity: (variantId: string, qty: number) => void;
  onRemoveItem: (variantId: string) => void;
  onApplyDiscount: (variantId: string, discount: number, type: 'PERCENTAGE' | 'FIXED') => void;
  cartDiscount: { value: number; type: 'PERCENTAGE' | 'FIXED' };
  onUpdateCartDiscount: (value: number, type: 'PERCENTAGE' | 'FIXED') => void;
  taxRate: number;
  customers: POSCustomerCacheItem[];
  selectedCustomerId: string | null;
  onSelectCustomer: (cust: POSCustomerCacheItem | null) => void;
  onHoldSale: () => void;
  onClearCart: () => void;
  onProceedCheckout: () => void;
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  grandTotal: number;
}

export const POSCartPanel: React.FC<POSCartPanelProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  cartDiscount,
  onUpdateCartDiscount,
  taxRate,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onHoldSale,
  onClearCart,
  onProceedCheckout,
  subtotal,
  totalDiscount,
  taxTotal,
  grandTotal,
}) => {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempDiscountVal, setTempDiscountVal] = useState(cartDiscount.value);
  const [tempDiscountType, setTempDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(cartDiscount.type);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleApplyCartDiscountSubmit = () => {
    onUpdateCartDiscount(tempDiscountVal, tempDiscountType);
    setShowDiscountModal(false);
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
      {/* Customer Selection Header */}
      <div className="p-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 mr-2">
          <span className="text-base">👤</span>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => {
              const val = e.target.value;
              const found = customers.find((c) => c.id === val) || null;
              onSelectCustomer(found);
            }}
            className="bg-slate-800 text-slate-100 text-xs font-semibold rounded px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500 w-full"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.name} ({cust.phone})
              </option>
            ))}
          </select>
        </div>

        {selectedCustomer && selectedCustomer.dueBalance > 0 && (
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
            Due: ৳{selectedCustomer.dueBalance}
          </span>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <span className="text-5xl mb-3 opacity-60">🛒</span>
            <p className="font-bold text-slate-600">Cart is Empty</p>
            <p className="text-xs text-slate-400 mt-1">
              Scan barcode or click products on the left to add items.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.variantId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-slate-900 truncate">{item.productName}</h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {item.variantName} • <span className="font-mono">{item.sku}</span>
                </p>
                <div className="text-xs text-slate-700 mt-0.5">
                  ৳{item.unitPrice} × {item.quantity} ={' '}
                  <span className="font-bold text-emerald-600">৳{item.lineTotal}</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                  className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-xs transition-colors"
                >
                  -
                </button>
                <span className="w-7 text-center font-bold text-xs text-slate-800">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                  className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-xs transition-colors"
                >
                  +
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemoveItem(item.variantId)}
                className="text-slate-400 hover:text-red-500 p-1 text-sm transition-colors"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Discount Block */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-bold text-slate-800">৳{subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-slate-600 items-center">
          <button
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            🏷️ Discount {cartDiscount.value > 0 && `(${cartDiscount.type === 'PERCENTAGE' ? `${cartDiscount.value}%` : `৳${cartDiscount.value}`})`}
          </button>
          <span className="font-bold text-amber-600">-৳{totalDiscount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Tax / VAT ({taxRate}%)</span>
          <span className="font-bold text-slate-800">৳{taxTotal.toLocaleString()}</span>
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base">
          <span className="font-extrabold text-slate-900">Grand Total</span>
          <span className="font-extrabold text-xl text-emerald-600">
            ৳{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onHoldSale}
          disabled={cartItems.length === 0}
          className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 py-2.5"
        >
          ⏸️ Hold [F4]
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onClearCart}
          disabled={cartItems.length === 0}
          className="text-xs bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 py-2.5"
        >
          🗑️ Clear [F9]
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onProceedCheckout}
          disabled={cartItems.length === 0}
          className="text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-md col-span-1"
        >
          💳 Pay [F2]
        </Button>
      </div>

      {/* Cart Level Discount Quick Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Apply Cart Discount</h3>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                min="0"
                value={tempDiscountVal}
                onChange={(e) => setTempDiscountVal(Number(e.target.value))}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm font-mono font-bold"
                placeholder="Discount value"
              />
              <select
                value={tempDiscountType}
                onChange={(e) => setTempDiscountType(e.target.value as any)}
                className="border border-slate-300 rounded px-2.5 py-2 text-xs font-bold bg-slate-50"
              >
                <option value="FIXED">BDT (৳)</option>
                <option value="PERCENTAGE">%</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDiscountModal(false)} className="text-xs py-1.5">
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleApplyCartDiscountSubmit} className="text-xs py-1.5">
                Apply Discount
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
