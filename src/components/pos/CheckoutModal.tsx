import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { POSPaymentMethodType, POSPaymentSplit } from '../../types/pos.types';
import { cartEngineService } from '../../features/pos/services/cart-engine.service';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onCompleteCheckout: (paymentSplits: POSPaymentSplit[], printReceipt: boolean) => Promise<void>;
}

const QUICK_CASH_AMOUNTS = [500, 1000, 2000, 5000];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  onCompleteCheckout,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethodType>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(grandTotal);
  const [paymentSplits, setPaymentSplits] = useState<POSPaymentSplit[]>([]);
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trxRef, setTrxRef] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(grandTotal);
      setPaymentSplits([{ paymentMethod: 'CASH', amount: grandTotal }]);
      setSelectedMethod('CASH');
      setIsSubmitting(false);
      setTrxRef('');
    }
  }, [isOpen, grandTotal]);

  const changeDueCalc = cartEngineService.calculateChangeDue(grandTotal, paidAmount);

  const handleSelectMethod = (method: POSPaymentMethodType) => {
    setSelectedMethod(method);
    setPaymentSplits([{ paymentMethod: method, amount: paidAmount, transactionReference: trxRef }]);
  };

  const handlePaidAmountChange = (val: number) => {
    setPaidAmount(val);
    setPaymentSplits([{ paymentMethod: selectedMethod, amount: val, transactionReference: trxRef }]);
  };

  const handleQuickCash = (amount: number) => {
    handlePaidAmountChange(amount);
  };

  const handleExactCash = () => {
    handlePaidAmountChange(grandTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCompleteCheckout(paymentSplits, printReceipt);
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💳 POS Counter Checkout" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payable Header Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-xl text-center shadow-inner">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Amount Payable</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">৳{grandTotal.toLocaleString()}</p>
        </div>

        {/* Payment Method Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '💵 Cash', value: 'CASH' },
              { label: '📱 bKash', value: 'BKASH' },
              { label: '📲 Nagad', value: 'NAGAD' },
              { label: '🚀 Rocket', value: 'ROCKET' },
              { label: '💳 Card', value: 'CARD' },
              { label: '📋 Due', value: 'DUE' },
            ].map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => handleSelectMethod(m.value as POSPaymentMethodType)}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  selectedMethod === m.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Cash Buttons (For Cash Method) */}
        {selectedMethod === 'CASH' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quick Cash Tenders</label>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={handleExactCash}
                className="py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded text-xs hover:bg-emerald-100"
              >
                Exact
              </button>
              {QUICK_CASH_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="py-1.5 bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded text-xs hover:bg-slate-200"
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Digital Payment Reference (For bKash, Nagad, Card, etc.) */}
        {selectedMethod !== 'CASH' && selectedMethod !== 'DUE' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / TRX ID</label>
            <input
              type="text"
              value={trxRef}
              onChange={(e) => {
                setTrxRef(e.target.value);
                setPaymentSplits([{ paymentMethod: selectedMethod, amount: paidAmount, transactionReference: e.target.value }]);
              }}
              placeholder="e.g. TRX-BKASH-9901"
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono"
            />
          </div>
        )}

        {/* Amount Paid & Change Due Calculation */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid (৳)</label>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => handlePaidAmountChange(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-2 text-base font-extrabold text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {changeDueCalc.changeDue > 0 ? 'Change Due' : 'Remaining Balance'}
            </label>
            <div
              className={`px-3 py-2 rounded font-extrabold text-base ${
                changeDueCalc.changeDue > 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : changeDueCalc.remainingDue > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              ৳
              {changeDueCalc.changeDue > 0
                ? changeDueCalc.changeDue.toLocaleString()
                : changeDueCalc.remainingDue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Thermal Receipt Print Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="printReceipt"
            checked={printReceipt}
            onChange={(e) => setPrintReceipt(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="printReceipt" className="text-xs font-semibold text-slate-700 cursor-pointer">
            🖨️ Automatically Print Thermal 80mm Receipt after checkout
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs py-2">
            Cancel [Esc]
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="text-xs font-extrabold py-2 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-md"
          >
            {isSubmitting ? 'Processing...' : 'Complete Sale [F2]'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
