import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface POSHeaderProps {
  registerName: string;
  locationName?: string;
  cashierName: string;
  isOnline: boolean;
  pendingOfflineCount: number;
  heldSalesCount: number;
  onOpenHeldSales: () => void;
  onOpenCloseRegister: () => void;
  onOpenShortcutsHelp: () => void;
  onTriggerSync?: () => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  registerName,
  locationName = 'Main Branch',
  cashierName,
  isOnline,
  pendingOfflineCount,
  heldSalesCount,
  onOpenHeldSales,
  onOpenCloseRegister,
  onOpenShortcutsHelp,
  onTriggerSync,
}) => {
  return (
    <header className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-md select-none">
      {/* Left: Store & Register Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-slate-100">{registerName}</h1>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              {locationName}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span>Cashier:</span>
            <span className="font-medium text-slate-200">{cashierName}</span>
          </p>
        </div>
      </div>

      {/* Middle: Live Connectivity & Sync Queue Badge */}
      <div className="flex items-center gap-3">
        {isOnline ? (
          <Badge variant="success" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </Badge>
        ) : (
          <Badge variant="warning" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Offline Mode
          </Badge>
        )}

        {pendingOfflineCount > 0 && (
          <button
            type="button"
            onClick={onTriggerSync}
            className="flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full hover:bg-amber-500/30 transition-colors"
            title="Click to manually sync offline queue"
          >
            <span>🔄 {pendingOfflineCount} Queued Offline</span>
          </button>
        )}
      </div>

      {/* Right: Actions & Shortcuts */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenHeldSales}
          className="relative text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 px-3 py-1.5"
        >
          <span>⏸️ Hold Sales [F5]</span>
          {heldSalesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
              {heldSalesCount}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onOpenShortcutsHelp}
          className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 px-2.5 py-1.5"
          title="View Keyboard Shortcuts"
        >
          ⌨️ Hotkeys
        </Button>

        <Button
          type="button"
          variant="danger"
          onClick={onOpenCloseRegister}
          className="text-xs font-semibold px-3 py-1.5 shadow-sm"
        >
          🔴 Close Shift
        </Button>
      </div>
    </header>
  );
};
