import React, { useState } from 'react';
import {
  CRMCustomerSummary,
  CustomerNoteDTO,
  RewardTransactionDTO,
} from '../../types/customer-crm.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CRMCustomerSummary | null;
  rewardHistory?: RewardTransactionDTO[];
  notes?: CustomerNoteDTO[];
  orderHistory?: any[];
  onAddNote: (noteText: string, isImportant: boolean) => Promise<void>;
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  rewardHistory = [],
  notes = [],
  orderHistory = [],
  onAddNote,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'notes'>('orders');
  const [newNoteText, setNewNoteText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customer) return null;

  const profile = customer.profile;

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddNote(newNoteText.trim(), isImportant);
      setNewNoteText('');
      setIsImportant(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add staff note.');
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
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-extrabold text-white text-base">
                👤
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight">{customer.name}</h2>
                <p className="text-xs text-slate-400">
                  {customer.phone} {customer.email ? `• ${customer.email}` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg p-1">
              ✕
            </button>
          </div>

          {/* Profile Context Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-700">Membership Tier:</div>
              <Badge variant="info">{profile.membershipTier}</Badge>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold">LTV (BDT)</div>
                <div className="font-extrabold text-emerald-600 text-xs">
                  ৳{profile.lifetimeValue.toLocaleString()}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold">Total Orders</div>
                <div className="font-extrabold text-slate-900 text-xs">{profile.totalOrdersCount}</div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold">AOV</div>
                <div className="font-extrabold text-slate-700 text-xs">
                  ৳{profile.averageOrderValue.toLocaleString()}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold">Reward Pts</div>
                <div className="font-extrabold text-blue-600 text-xs">{profile.rewardPoints}</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-4 text-xs font-bold gap-4 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-3 transition-colors ${
                activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Order Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className={`py-3 transition-colors ${
                activeTab === 'rewards' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Reward Ledger ({rewardHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`py-3 transition-colors ${
                activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              Staff Internal Notes ({notes.length})
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'orders' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Purchase History Timeline</h4>
                {orderHistory.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">No orders record found.</p>
                ) : (
                  orderHistory.map((ord, idx) => (
                    <Card key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600">{ord.orderNumber}</span>
                        <Badge variant="info" className="text-[10px]">
                          {ord.currentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-1">
                        <span>Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                        <span className="font-extrabold text-emerald-600">
                          ৳{ord.grandTotal.toLocaleString()} BDT
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Reward Points Ledger</h4>
                {rewardHistory.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">No reward transactions recorded yet.</p>
                ) : (
                  rewardHistory.map((tx) => (
                    <Card key={tx.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{tx.actionType}</span>
                        <span
                          className={`font-extrabold ${
                            tx.pointsChanged >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {tx.pointsChanged >= 0 ? `+${tx.pointsChanged}` : tx.pointsChanged} Pts
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{tx.note}</p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Staff Add Note Form */}
                <form onSubmit={handleNoteSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-900">Add Staff Internal Note</h5>
                  <textarea
                    required
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter staff note (e.g. Preferred courier, special customer request)..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isImportant}
                        onChange={(e) => setIsImportant(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Mark as Important</span>
                    </label>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="text-xs py-1 px-3">
                      Add Note
                    </Button>
                  </div>
                </form>

                {/* Notes Feed */}
                <div className="space-y-3">
                  {notes.map((n) => (
                    <Card
                      key={n.id}
                      className={`p-3 border rounded-xl space-y-1 ${
                        n.isImportant ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.createdBy}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{n.noteText}</p>
                    </Card>
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
