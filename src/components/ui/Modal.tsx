import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  footer,
  closeOnOverlayClick = true,
  children,
  className = '',
}) => {
  // ESC key event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="ag-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={`ag-modal-container ${className}`}>
        {title && (
          <div className="ag-modal-header">
            <h3 className="ag-card-title">{title}</h3>
            <button type="button" className="ag-modal-close-btn" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        )}
        <div className="ag-modal-body">{children}</div>
        {footer && <div className="ag-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
