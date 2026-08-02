import React from 'react';
import { Button } from '../ui/Button';

export interface ReportExportToolbarProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExportingPDF?: boolean;
  isExportingExcel?: boolean;
}

export const ReportExportToolbar: React.FC<ReportExportToolbarProps> = ({
  onExportPDF,
  onExportExcel,
  isExportingPDF = false,
  isExportingExcel = false,
}) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <Button
        type="button"
        variant="outline"
        onClick={onExportPDF}
        disabled={isExportingPDF}
        className="text-xs font-bold py-2 px-3.5 bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 shadow-xs"
      >
        <span>📄 {isExportingPDF ? 'Compiling PDF...' : 'Export PDF Report'}</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onExportExcel}
        disabled={isExportingExcel}
        className="text-xs font-bold py-2 px-3.5 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs"
      >
        <span>📊 {isExportingExcel ? 'Exporting XLS...' : 'Export Excel (.xlsx)'}</span>
      </Button>
    </div>
  );
};
