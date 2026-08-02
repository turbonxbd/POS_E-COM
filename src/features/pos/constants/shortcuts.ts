import { ShortcutConfig } from '../../../types/pos.types';

export enum POS_SHORTCUT_ACTIONS {
  FOCUS_SEARCH = 'FOCUS_SEARCH',
  CHECKOUT = 'CHECKOUT',
  QUICK_PAY_CASH = 'QUICK_PAY_CASH',
  HOLD_SALE = 'HOLD_SALE',
  RECALL_HOLD_SALE = 'RECALL_HOLD_SALE',
  SPLIT_PAYMENT = 'SPLIT_PAYMENT',
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  CLEAR_CART = 'CLEAR_CART',
  CLOSE_MODAL = 'CLOSE_MODAL',
  APPLY_DISCOUNT = 'APPLY_DISCOUNT',
}

/**
 * Standard Configurable POS Keyboard Shortcuts Mapping
 */
export const POS_SHORTCUTS_MAP: ShortcutConfig[] = [
  {
    key: 'F1',
    action: POS_SHORTCUT_ACTIONS.FOCUS_SEARCH,
    description: 'Search Product or Scan Barcode',
    isCustomizable: false,
  },
  {
    key: 'F2',
    action: POS_SHORTCUT_ACTIONS.CHECKOUT,
    description: 'Proceed to Checkout & Pay',
    isCustomizable: true,
  },
  {
    key: 'F3',
    action: POS_SHORTCUT_ACTIONS.QUICK_PAY_CASH,
    description: 'Quick Checkout with Exact Cash',
    isCustomizable: true,
  },
  {
    key: 'F4',
    action: POS_SHORTCUT_ACTIONS.HOLD_SALE,
    description: 'Hold / Park Current Cart Sale',
    isCustomizable: true,
  },
  {
    key: 'F5',
    action: POS_SHORTCUT_ACTIONS.RECALL_HOLD_SALE,
    description: 'View & Resume Held Sales List',
    isCustomizable: true,
  },
  {
    key: 'F8',
    action: POS_SHORTCUT_ACTIONS.ADD_CUSTOMER,
    description: 'Select or Add Customer',
    isCustomizable: true,
  },
  {
    key: 'F9',
    action: POS_SHORTCUT_ACTIONS.CLEAR_CART,
    description: 'Clear Active Cart Items',
    isCustomizable: true,
  },
  {
    key: 'Escape',
    action: POS_SHORTCUT_ACTIONS.CLOSE_MODAL,
    description: 'Close Modals or Drawers',
    isCustomizable: false,
  },
];

/**
 * Parses native browser KeyboardEvent and matches against POS shortcut configurations.
 */
export function matchKeyboardShortcut(
  event: KeyboardEvent,
  customShortcuts: ShortcutConfig[] = POS_SHORTCUTS_MAP
): ShortcutConfig | null {
  const pressedKey = event.key;
  const pressedCode = event.code;

  for (const shortcut of customShortcuts) {
    const targetKey = shortcut.key.trim().toLowerCase();

    // Check Function Keys (F1 - F12) or specific keys
    if (
      pressedKey.toLowerCase() === targetKey ||
      pressedCode.toLowerCase() === targetKey ||
      (targetKey === 'escape' && (pressedKey === 'Escape' || pressedCode === 'Escape'))
    ) {
      return shortcut;
    }
  }

  return null;
}

/**
 * Returns formatted hotkey badge text for POS UI buttons.
 */
export function getShortcutBadgeText(action: POS_SHORTCUT_ACTIONS): string {
  const shortcut = POS_SHORTCUTS_MAP.find((s) => s.action === action);
  return shortcut ? shortcut.key : '';
}
