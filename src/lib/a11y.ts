import { useEffect } from 'react';

/**
 * Custom React Hook for WCAG 2.1 Keyboard Focus Trapping inside active Modal Dialogs and Slide-over Drawers.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose?: () => void
): void {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const element = containerRef.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isOpen, onClose]);
}

/**
 * Returns WCAG 2.1 AA compliant ARIA attributes for modal dialog containers.
 */
export function getAriaModalProps(titleId: string, isOpen: boolean) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-hidden': !isOpen,
  };
}
