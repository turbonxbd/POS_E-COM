import React, { useState } from 'react';
import { DEFAULT_LOYALTY_CONFIG, LoyaltyConfig } from '../../types/customer-crm.types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export interface LoyaltyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: LoyaltyConfig;
  onSaveConfig: (config: LoyaltyConfig) => Promise<void>;
}

export const LoyaltyConfigModal: React.FC<LoyaltyConfigModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_LOYALTY_CONFIG,
  onSaveConfig,
}) => {
  const [spendRatio, setSpendRatio] = useState<number>(config.spendPointsRatio);
  const [pointValue, setPointValue] = useState<number>(config.pointValueBDT);
  const [silverThreshold, setSilverThreshold] = useState<number>(config.tierThresholds.SILVER);
  const [goldThreshold, setGoldThreshold] = useState<number>(config.tierThresholds.GOLD);
  const [platinumThreshold, setPlatinumThreshold] = useState<number>(config.tierThresholds.PLATINUM);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onSaveConfig({
        spendPointsRatio: spendRatio,
        pointValueBDT: pointValue,
        tierThresholds: {
          BRONZE: 0,
          SILVER: silverThreshold,
          GOLD: goldThreshold,
          PLATINUM: platinumThreshold,
        },
      });
      alert('Loyalty & Membership rules saved successfully!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save loyalty configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Loyalty Program & Membership Configurator">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none">
        {/* Reward Points Allocation Formula */}
        <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>🎁</span> Points Calculation & Redemption Formula
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Spend Ratio (BDT for 1 Pt)</label>
              <input
                type="number"
                min="1"
                value={spendRatio}
                onChange={(e) => setSpendRatio(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. ৳100 spent = 1 Reward Point</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">1 Point Value (BDT Discount)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={pointValue}
                onChange={(e) => setPointValue(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. 1 Point = ৳1.0 BDT discount</p>
            </div>
          </div>
        </Card>

        {/* Membership Tier LTV Thresholds */}
        <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>🏆</span> Membership Tier LTV Thresholds (BDT)
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-700">🥉 Bronze Tier:</span>
              <span className="font-mono text-slate-500 font-bold">৳0 BDT (Default)</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="font-bold text-slate-700">🥈 Silver Tier Threshold (LTV):</label>
              <input
                type="number"
                value={silverThreshold}
                onChange={(e) => setSilverThreshold(Number(e.target.value))}
                className="w-36 border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="font-bold text-slate-700">🥇 Gold Tier Threshold (LTV):</label>
              <input
                type="number"
                value={goldThreshold}
                onChange={(e) => setGoldThreshold(Number(e.target.value))}
                className="w-36 border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="font-bold text-slate-700">💎 Platinum Tier Threshold (LTV):</label>
              <input
                type="number"
                value={platinumThreshold}
                onChange={(e) => setPlatinumThreshold(Number(e.target.value))}
                className="w-36 border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </Card>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs py-2 px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="text-xs font-bold py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Loyalty Rules'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
