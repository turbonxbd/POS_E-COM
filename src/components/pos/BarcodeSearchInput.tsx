import React, { useRef, useEffect } from 'react';
import { Input } from '../ui/Input';

export interface BarcodeSearchInputProps {
  query: string;
  onQueryChange: (val: string) => void;
  onScanSubmit: (scannedValue: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export const BarcodeSearchInput: React.FC<BarcodeSearchInputProps> = ({
  query,
  onQueryChange,
  onScanSubmit,
  autoFocus = true,
  placeholder = 'Scan barcode or search SKU/Product [F1]...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and keep focused for hardware scanner
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      onScanSubmit(query.trim());
    }
  };

  const handleClear = () => {
    onQueryChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none">
          📷
        </span>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 py-3 bg-white text-slate-900 border-2 border-blue-500/30 focus:border-blue-600 font-mono text-sm rounded-lg shadow-sm w-full transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-600 text-sm bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
            title="Clear search"
          >
            ✕
          </button>
        ) : (
          <span className="absolute right-3 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase select-none">
            F1
          </span>
        )}
      </div>
    </div>
  );
};
