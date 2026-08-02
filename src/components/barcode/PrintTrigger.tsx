import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { BulkBarcodeItemDTO, BarcodePreset } from '../../types/barcode.types';

export interface PrintTriggerProps {
  queue: BulkBarcodeItemDTO[];
  preset: BarcodePreset;
  onPrintComplete?: () => void;
}

export const PrintTrigger: React.FC<PrintTriggerProps> = ({ queue, preset, onPrintComplete }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const totalCopies = queue.reduce((sum, item) => sum + item.quantityPrinted, 0);

  const handlePrintTrigger = async () => {
    if (queue.length === 0) {
      alert('Print queue is empty. Add products before printing.');
      return;
    }

    setIsPrinting(true);

    try {
      // Build printable html sheet content
      const res = await fetch('/api/merchant/barcode/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: queue,
          presetId: preset.id,
        }),
      });

      const data = await res.json();
      setIsPrinting(false);

      if (data.success) {
        // Trigger native browser print
        window.print();
        if (onPrintComplete) onPrintComplete();
      } else {
        alert(data.error || 'Failed to prepare print payload.');
      }
    } catch {
      setIsPrinting(false);
      alert('An error occurred triggering thermal sticker print.');
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      isLoading={isPrinting}
      disabled={queue.length === 0}
      onClick={handlePrintTrigger}
      style={{ width: '100%' }}
    >
      🖨️ Print {totalCopies} Thermal Sticker Label(s)
    </Button>
  );
};
