import React, { useState } from 'react';
import { ExpenseCategoryDTO, ExpensePaymentMethodType } from '../../types/reports.types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategoryDTO[];
  onAddExpense: (payload: any) => Promise<void>;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddExpense,
}) => {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat-1');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethodType>('CASH');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddExpense({
        categoryId,
        title: title.trim(),
        amount: Number(amount),
        expenseDate,
        paymentMethod,
        referenceNo: referenceNo.trim() || null,
        note: note.trim() || null,
      });

      setTitle('');
      setAmount('');
      setReferenceNo('');
      setNote('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to record operational expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Record Merchant Operational Expense">
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs select-none">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-semibold"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Expense Title / Description</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly Banani Store Rent, Electricity Bill..."
            className="w-full border border-slate-300 rounded-lg p-2 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Amount (BDT ৳)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethodType)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs"
            >
              <option value="CASH">💵 Cash</option>
              <option value="BANK">🏦 Bank Transfer</option>
              <option value="MOBILE_BANKING">📱 Mobile Banking (bKash/Nagad)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reference / Txn No. (Optional)</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. BKASH-881920"
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Internal Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add internal notes or memo..."
            className="w-full border border-slate-300 rounded-lg p-2 text-xs"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs py-2 px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="text-xs font-bold py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save Expense Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
