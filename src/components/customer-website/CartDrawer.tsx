import React, { useState } from 'react';
import { CartState } from '../../types/customer-website.types';
import { Button } from '../ui/Button';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartState;
  onUpdateQuantity: (variantId: string, qty: number) => void;
  onRemoveItem: (variantId: string) => void;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onProceedCheckout,
}) => {
  const [couponInput, setCouponInput] = useState<string>('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  if (!isOpen) return null;

  const FREE_SHIPPING_LIMIT = 3000;
  const freeShippingProgress = Math.min(100, (cart.subtotal / FREE_SHIPPING_LIMIT) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_LIMIT - cart.subtotal);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || isApplyingCoupon) return;

    try {
      setIsApplyingCoupon(true);
      await onApplyCoupon(couponInput.trim());
      setCouponInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h2 className="font-extrabold text-base tracking-tight">Your Shopping Cart</h2>
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.itemCount}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-blue-50 border-b border-blue-100 p-3 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-blue-900 font-medium">
                Add <span className="font-bold text-blue-700">৳{remainingForFreeShipping.toLocaleString()}</span> more for <span className="font-bold uppercase text-emerald-600">Free Shipping!</span>
              </p>
            ) : (
              <p className="text-emerald-700 font-bold flex items-center gap-1">
                <span>🎉</span>
                <span>You unlocked FREE Delivery across Bangladesh!</span>
              </p>
            )}
            <div className="w-full bg-blue-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Itemized List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <span className="text-5xl mb-3 opacity-50">🛍️</span>
                <p className="font-bold text-slate-600">Your cart is empty</p>
                <p className="text-xs text-slate-400 mt-1">Explore our shop and add items to your cart.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-lg p-1 flex items-center justify-center border border-slate-200">
                    <img
                      src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&auto=format&fit=crop&q=80"
                      alt={item.productName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.productName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{item.variantName}</p>
                    <div className="text-xs text-emerald-600 font-extrabold mt-0.5">
                      ৳{item.unitPrice.toLocaleString()} × {item.quantity} = ৳{item.lineTotal.toLocaleString()}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                      className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                      className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variantId)}
                    className="text-slate-400 hover:text-red-500 p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Coupon Code Input */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <form onSubmit={handleCouponSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Promo / Coupon code (e.g. EID2026)"
                className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono uppercase font-semibold"
              />
              <Button type="submit" variant="outline" disabled={isApplyingCoupon} className="text-xs py-1.5 px-3">
                Apply
              </Button>
            </form>
            {cart.couponCode && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ Coupon "{cart.couponCode}" active (Saved ৳{cart.discountAmount})
              </p>
            )}
          </div>

          {/* Summary & Checkout Footer */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">৳{cart.subtotal.toLocaleString()}</span>
            </div>

            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">-৳{cart.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Shipping Charge</span>
              <span className="font-bold text-slate-900">
                {cart.shippingFee === 0 ? 'FREE' : `৳${cart.shippingFee}`}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
              <span className="text-slate-900">Total Payable</span>
              <span className="text-emerald-600 text-lg">৳{cart.grandTotal.toLocaleString()}</span>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={onProceedCheckout}
              disabled={cart.items.length === 0}
              className="w-full mt-3 py-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
            >
              Proceed to Checkout →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
