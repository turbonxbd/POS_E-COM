import React, { useState } from 'react';
import { CartState, CheckoutFormPayload, StorefrontPaymentMethodType } from '../../types/customer-website.types';
import { DivisionDistricts, shippingService } from '../../features/customer-website/services/shipping.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export interface CheckoutViewProps {
  cart: CartState;
  divisions?: DivisionDistricts[];
  onPlaceOrder: (payload: CheckoutFormPayload) => Promise<void>;
  merchantId?: string;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  divisions = shippingService.getBangladeshDivisionsAndDistricts(),
  onPlaceOrder,
  merchantId = 'merch-techstore',
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('Dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<StorefrontPaymentMethodType>('COD');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDivisionObject = divisions.find((d) => d.division === selectedDivision) || divisions[0];

  const handleDivisionChange = (divName: string) => {
    setSelectedDivision(divName);
    const divObj = divisions.find((d) => d.division === divName);
    if (divObj && divObj.districts.length > 0) {
      setSelectedDistrict(divObj.districts[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !addressDetails || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onPlaceOrder({
        merchantId,
        recipientName,
        recipientPhone,
        recipientEmail: recipientEmail || null,
        division: selectedDivision,
        district: selectedDistrict,
        addressDetails,
        paymentMethod,
        deliveryInstructions: deliveryInstructions || null,
        cartItems: cart.items,
        couponCode: cart.couponCode,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6">🔒 Secure E-Commerce Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipping Address & Payment Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Card */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📍</span> 1. Shipping & Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Karim Ahmed"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. +8801700112233"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. karim@gmail.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            {/* Division & District Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Division *</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-slate-50"
                >
                  {divisions.map((d) => (
                    <option key={d.division} value={d.division}>
                      {d.division} Division
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-slate-50"
                >
                  {activeDivisionObject.districts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full House Address & Road Details *
              </label>
              <textarea
                required
                rows={2}
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="e.g. House 42, Road 11, Block D, Banani"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Leave with security guard if unavailable"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </Card>

          {/* Payment Method Selection Card */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💳</span> 2. Select Payment Option
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'COD',
                  title: '💵 Cash on Delivery',
                  desc: 'Pay cash when product is delivered to your address.',
                },
                {
                  id: 'BKASH',
                  title: '📱 bKash Payment',
                  desc: 'Pay via bKash mobile banking wallet.',
                },
                {
                  id: 'NAGAD',
                  title: '📲 Nagad Payment',
                  desc: 'Pay via Nagad digital payment gateway.',
                },
                {
                  id: 'CARD',
                  title: '💳 Debit / Credit Card',
                  desc: 'Pay via Visa, Mastercard or SSLCommerz.',
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as StorefrontPaymentMethodType)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'bg-blue-50 border-blue-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900">{m.title}</h4>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id as StorefrontPaymentMethodType)}
                      className="text-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary & CTAs */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Summary ({cart.itemCount} Items)</h2>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.productName}</h4>
                    <p className="text-[11px] text-slate-500">{item.variantName} × {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-800">৳{item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">৳{cart.subtotal.toLocaleString()}</span>
              </div>

              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({cart.couponCode})</span>
                  <span className="font-bold">-৳{cart.discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge</span>
                <span className="font-bold text-slate-900">
                  {cart.shippingFee === 0 ? 'FREE' : `৳${cart.shippingFee}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-extrabold">
                <span className="text-slate-900">Grand Total</span>
                <span className="text-emerald-600 text-xl">৳{cart.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full py-3.5 font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all active:scale-95"
            >
              {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order →'}
            </Button>

            <p className="text-[10px] text-slate-400 text-center">
              🔒 256-Bit SSL Encrypted & Protected E-Commerce Checkout
            </p>
          </Card>
        </div>
      </form>
    </div>
  );
};
