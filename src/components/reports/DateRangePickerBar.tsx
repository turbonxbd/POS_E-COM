import React from 'react';
import { DateRangePreset } from '../../types/reports.types';

export interface DateRangePickerBarProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  startDate: string;
  endDate: string;
  onCustomDateChange: (startDate: string, endDate: string) => void;
}

export const DateRangePickerBar: React.FC<DateRangePickerBarProps> = ({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onCustomDateChange,
}) => {
  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: 'YESTERDAY', label: 'Yesterday' },
    { id: 'THIS_WEEK', label: 'Last 7 Days' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'THIS_YEAR', label: 'This Year' },
    { id: 'CUSTOM', label: '📅 Custom Range' },
  ];

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Preset Toggles */}
      <div className="flex border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50 gap-0.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange(p.id)}
            className={`py-1.5 px-3 rounded-md font-bold transition-colors ${
              preset === p.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Pickers */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-500">From:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onCustomDateChange(e.target.value, endDate)}
          className="border border-slate-300 rounded-md px-2 py-1 font-mono text-xs bg-slate-50"
        />
        <span className="font-bold text-slate-500">To:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onCustomDateChange(startDate, e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-1 font-mono text-xs bg-slate-50"
        />
      </div>
    </div>
  );
};
