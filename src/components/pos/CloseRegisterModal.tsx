import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface CloseRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  openingBalance: number;
  onConfirmClose: (actualCash: number, notes?: string) => Promise<void>;
}

export const CloseRegisterModal: React.FC<CloseRegisterModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  openingBalance,
  onConfirmClose,
}) => {
  const [actualCash, setActualCash] = useState<number>(openingBalance);
  const [notes, setNotes] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing) return;

    try {
      setIsClosing(true);
      await onConfirmClose(actualCash, notes);
      onClose();
    } catch (err) {
      console.error('Error closing session:', err);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔴 Close Cash Register Shift & Z-Report" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-bold">End of Shift Reconciliation</p>
          <p className="mt-0.5">Count physical cash in drawer and enter below to generate Z-Report.</p>
        </div>

        <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
          <span className="text-slate-600 font-semibold">Opening Cash Balance</span>
          <span className="font-mono font-bold text-slate-800">৳{openingBalance.toLocaleString()}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Actual Cash Count in Drawer (৳)
          </label>
          <input
            type="number"
            min="0"
            required
            value={actualCash}
            onChange={(e) => setActualCash(Number(e.target.value))}
            className="w-full border-2 border-blue-500 rounded px-3 py-2 text-lg font-extrabold text-slate-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Shift Notes / Remarks</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. ৳50 shortage due to coin change difference..."
            className="w-full border border-slate-300 rounded px-3 py-2 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs py-2">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isClosing}
            className="text-xs font-bold py-2 px-5"
          >
            {isClosing ? 'Closing Shift...' : 'Close Register & Print Z-Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
