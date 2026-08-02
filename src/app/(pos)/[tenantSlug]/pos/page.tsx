'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { POSCartItem, POSPaymentSplit, POSOrderDTO, ShortcutConfig } from '../../../../types/pos.types';
import { ProductDTO, ProductVariantDTO, CategoryDTO } from '../../../../types/inventory.types';
import { catalogService } from '../../../../features/inventory/services/catalog.service';
import { cartEngineService } from '../../../../features/pos/services/cart-engine.service';
import { holdSaleService } from '../../../../features/pos/services/hold-sale.service';
import { checkoutService } from '../../../../features/pos/services/checkout.service';
import { closingService } from '../../../../features/pos/services/closing.service';
import { posOfflineDB, POSCustomerCacheItem } from '../../../../features/pos/offline/pos-db';
import { posSyncManager } from '../../../../features/pos/offline/sync-manager';
import { matchKeyboardShortcut, POS_SHORTCUT_ACTIONS } from '../../../../features/pos/constants/shortcuts';

import { POSHeader } from '../../../../components/pos/POSHeader';
import { BarcodeSearchInput } from '../../../../components/pos/BarcodeSearchInput';
import { ProductGrid } from '../../../../components/pos/ProductGrid';
import { POSCartPanel } from '../../../../components/pos/POSCartPanel';
import { CheckoutModal } from '../../../../components/pos/CheckoutModal';
import { CloseRegisterModal } from '../../../../components/pos/CloseRegisterModal';
import { ThermalReceipt } from '../../../../components/pos/ThermalReceipt';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';

export default function POSTerminalPage() {
  const merchantId = 'merch-techstore';
  const registerId = 'reg-counter-01';

  // Catalog & Customer States
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [customers, setCustomers] = useState<POSCustomerCacheItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Cart & Search States
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cartDiscount, setCartDiscount] = useState<{ value: number; type: 'PERCENTAGE' | 'FIXED' }>({
    value: 0,
    type: 'FIXED',
  });
  const [taxRate] = useState<number>(5);

  // Modals & UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState<boolean>(false);
  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState<boolean>(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);

  // Connectivity & Queue States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [heldSalesList, setHeldSalesList] = useState<any[]>([]);

  // Receipt printing state
  const [lastCompletedOrder, setLastCompletedOrder] = useState<POSOrderDTO | null>(null);
  const [lastReceiptItems, setLastReceiptItems] = useState<POSCartItem[]>([]);

  // 1. Initial Load & Hydration
  useEffect(() => {
    async function loadInitialData() {
      try {
        const prodList = await catalogService.getProducts(merchantId);
        const catList = await catalogService.getCategories(merchantId);
        const custData = await posOfflineDB.getCachedCustomers(merchantId);
        const heldSales = await holdSaleService.listHeldSales(merchantId, registerId);
        const pendingQueue = await posOfflineDB.getPendingOfflineOrders(merchantId);

        setProducts(prodList);
        setCategories(catList);
        setCustomers(custData);
        setHeldSalesList(heldSales);
        setPendingOfflineCount(pendingQueue.length);

        // Cache catalog locally for offline availability
        await posOfflineDB.cacheCatalog(merchantId, prodList);
      } catch (err) {
        console.error('Failed to load POS terminal data:', err);
      }
    }

    loadInitialData();

    // Subscribe to online/offline network monitor
    setIsOnline(posSyncManager.isOnline());
    const unsubNetwork = posSyncManager.onNetworkStatusChange((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubNetwork();
    };
  }, []);

  // Recalculate Cart Summary
  const cartSummary = cartEngineService.calculateCartTotals(cartItems, cartDiscount, taxRate);

  // Cart Actions
  const handleAddToCart = (variant: ProductVariantDTO, product: ProductDTO) => {
    const { updatedItems } = cartEngineService.addItemToCart(cartItems, variant, product, 1, taxRate);
    setCartItems(updatedItems);
  };

  const handleBarcodeScanSubmit = (scannedValue: string) => {
    const match = cartEngineService.matchProductByBarcodeOrSKU(scannedValue, products);
    if (match.found && match.matchedVariant && match.matchedProduct) {
      handleAddToCart(match.matchedVariant, match.matchedProduct);
      setSearchQuery('');
    } else {
      alert(match.message || 'No product found for barcode scanner lookup.');
    }
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    setCartItems((prev) => cartEngineService.updateItemQuantity(prev, variantId, quantity));
  };

  const handleRemoveItem = (variantId: string) => {
    setCartItems((prev) => cartEngineService.removeItemFromCart(prev, variantId));
  };

  const handleApplyItemDiscount = (
    variantId: string,
    discount: number,
    type: 'PERCENTAGE' | 'FIXED'
  ) => {
    setCartItems((prev) => cartEngineService.applyItemDiscount(prev, variantId, discount, type));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm('Are you sure you want to clear the active POS cart?')) {
      setCartItems([]);
      setCartDiscount({ value: 0, type: 'FIXED' });
    }
  };

  // Hold Sale Handlers
  const handleHoldSale = async () => {
    if (cartItems.length === 0) return;
    const note = prompt('Enter note for hold sale (optional):') || undefined;

    await holdSaleService.holdSale({
      merchantId,
      registerId,
      cashierId: 'cashier-demo-01',
      customerId: selectedCustomerId,
      cartItems,
      subtotal: cartSummary.subtotal,
      discountAmount: cartSummary.totalDiscount,
      taxAmount: cartSummary.taxTotal,
      grandTotal: cartSummary.grandTotal,
      holdNote: note,
    });

    setCartItems([]);
    setCartDiscount({ value: 0, type: 'FIXED' });
    const updatedHolds = await holdSaleService.listHeldSales(merchantId, registerId);
    setHeldSalesList(updatedHolds);
    alert('Active sale put on hold successfully!');
  };

  const handleResumeHoldSale = async (holdSaleId: string) => {
    try {
      const res = await holdSaleService.resumeSale(merchantId, holdSaleId);
      setCartItems(res.cartItems);
      setIsHeldSalesOpen(false);
      const updatedHolds = await holdSaleService.listHeldSales(merchantId, registerId);
      setHeldSalesList(updatedHolds);

      if (res.stockWarnings.length > 0) {
        alert(`Stock Warning:\n${res.stockWarnings.join('\n')}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resume held sale.');
    }
  };

  // Checkout Completion Handler
  const handleCompleteCheckout = async (
    paymentSplits: POSPaymentSplit[],
    printReceipt: boolean
  ) => {
    const checkoutPayload = {
      merchantId,
      registerId,
      sessionId: 'session-demo-01',
      cashierId: 'cashier-demo-01',
      cashierName: 'Rahim Ahmed',
      customerId: selectedCustomerId,
      cartItems,
      subtotal: cartSummary.subtotal,
      discountAmount: cartSummary.totalDiscount,
      taxAmount: cartSummary.taxTotal,
      grandTotal: cartSummary.grandTotal,
      paymentSplits,
    };

    if (!isOnline) {
      // Enqueue in offline DB if device disconnected
      await posOfflineDB.enqueueOfflineOrder(checkoutPayload);
      const pendingQueue = await posOfflineDB.getPendingOfflineOrders(merchantId);
      setPendingOfflineCount(pendingQueue.length);
      alert('Network Offline: Transaction saved locally in offline queue!');
    } else {
      // Execute live online checkout
      const res = await checkoutService.processPOSCheckout(checkoutPayload);
      setLastCompletedOrder(res.order);
      setLastReceiptItems([...cartItems]);

      if (printReceipt) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    }

    setCartItems([]);
    setCartDiscount({ value: 0, type: 'FIXED' });
    setIsCheckoutOpen(false);
  };

  // Close Register Handler
  const handleConfirmCloseRegister = async (actualCash: number, notes?: string) => {
    const res = await closingService.closeRegisterSession(
      merchantId,
      'session-demo-01',
      actualCash,
      notes
    );
    alert(
      `Shift Closed Successfully!\nExpected Cash: ৳${res.zReport.expectedCashInDrawer}\nActual Cash: ৳${res.zReport.actualCashInDrawer}\nDifference: ৳${res.zReport.cashDifference}`
    );
  };

  // Global Keyboard Hotkey Listener
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing inside an open input/textarea (except barcode F1/Escape)
      const isInputTarget =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      const matchedShortcut = matchKeyboardShortcut(e);
      if (!matchedShortcut) return;

      switch (matchedShortcut.action) {
        case POS_SHORTCUT_ACTIONS.FOCUS_SEARCH:
          e.preventDefault();
          const searchElem = document.querySelector<HTMLInputElement>('input[type="text"]');
          if (searchElem) searchElem.focus();
          break;
        case POS_SHORTCUT_ACTIONS.CHECKOUT:
          e.preventDefault();
          if (cartItems.length > 0) setIsCheckoutOpen(true);
          break;
        case POS_SHORTCUT_ACTIONS.HOLD_SALE:
          e.preventDefault();
          if (cartItems.length > 0) handleHoldSale();
          break;
        case POS_SHORTCUT_ACTIONS.RECALL_HOLD_SALE:
          e.preventDefault();
          setIsHeldSalesOpen(true);
          break;
        case POS_SHORTCUT_ACTIONS.CLEAR_CART:
          e.preventDefault();
          if (cartItems.length > 0) handleClearCart();
          break;
        case POS_SHORTCUT_ACTIONS.CLOSE_MODAL:
          setIsCheckoutOpen(false);
          setIsCloseRegisterOpen(false);
          setIsHeldSalesOpen(false);
          setIsShortcutsHelpOpen(false);
          break;
        default:
          break;
      }
    },
    [cartItems]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans antialiased">
      {/* Thermal Printable Receipt View (Hidden except during window.print()) */}
      {lastCompletedOrder && (
        <ThermalReceipt order={lastCompletedOrder} cartItems={lastReceiptItems} />
      )}

      {/* POS Header Bar */}
      <div className="print:hidden">
        <POSHeader
          registerName="Counter Register 01"
          locationName="Dhaka Central Branch"
          cashierName="Rahim Ahmed"
          isOnline={isOnline}
          pendingOfflineCount={pendingOfflineCount}
          heldSalesCount={heldSalesList.length}
          onOpenHeldSales={() => setIsHeldSalesOpen(true)}
          onOpenCloseRegister={() => setIsCloseRegisterOpen(true)}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          onTriggerSync={async () => {
            const res = await posSyncManager.syncOfflineOrders(merchantId);
            const pendingQueue = await posOfflineDB.getPendingOfflineOrders(merchantId);
            setPendingOfflineCount(pendingQueue.length);
            alert(`Sync complete. Synced: ${res.syncedCount}, Failed: ${res.failedCount}`);
          }}
        />
      </div>

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex overflow-hidden print:hidden">
        {/* Left Side: Barcode Input & Interactive Product Grid */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Barcode Search Input Bar */}
          <div className="p-3 bg-white border-b border-slate-200 shadow-xs">
            <BarcodeSearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onScanSubmit={handleBarcodeScanSubmit}
            />
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-hidden">
            <ProductGrid
              products={products}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onProductClick={(variant, product) => handleAddToCart(variant, product)}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Right Side: Active Cart Panel */}
        <POSCartPanel
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onApplyDiscount={handleApplyItemDiscount}
          cartDiscount={cartDiscount}
          onUpdateCartDiscount={(value, type) => setCartDiscount({ value, type })}
          taxRate={taxRate}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(cust) => setSelectedCustomerId(cust ? cust.id : null)}
          onHoldSale={handleHoldSale}
          onClearCart={handleClearCart}
          onProceedCheckout={() => setIsCheckoutOpen(true)}
          subtotal={cartSummary.subtotal}
          totalDiscount={cartSummary.totalDiscount}
          taxTotal={cartSummary.taxTotal}
          grandTotal={cartSummary.grandTotal}
        />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        grandTotal={cartSummary.grandTotal}
        onCompleteCheckout={handleCompleteCheckout}
      />

      {/* Close Register Shift Modal */}
      <CloseRegisterModal
        isOpen={isCloseRegisterOpen}
        onClose={() => setIsCloseRegisterOpen(false)}
        sessionId="session-demo-01"
        openingBalance={5000}
        onConfirmClose={handleConfirmCloseRegister}
      />

      {/* Held Sales Recall Modal */}
      <Modal
        isOpen={isHeldSalesOpen}
        onClose={() => setIsHeldSalesOpen(false)}
        title="⏸️ Parked / Held Sales List"
        className="max-w-md"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {heldSalesList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No sales currently on hold.</p>
          ) : (
            heldSalesList.map((hold) => (
              <div
                key={hold.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    {hold.cartData?.customerName || 'Walk-in Customer'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {hold.cartData?.cartItems?.length || 0} Items • Total: ৳
                    {hold.cartData?.grandTotal}
                  </p>
                  {hold.holdNote && (
                    <p className="text-[10px] text-amber-700 italic mt-0.5">Note: {hold.holdNote}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleResumeHoldSale(hold.id)}
                  className="text-xs py-1 px-3"
                >
                  Resume
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Shortcuts Help Modal */}
      <Modal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        title="⌨️ Keyboard Hotkey Map"
        className="max-w-md"
      >
        <div className="space-y-2 text-xs divide-y divide-slate-100">
          {[
            { key: 'F1', desc: 'Focus Barcode Scanner / Product Search Input' },
            { key: 'F2', desc: 'Open Multi-Payment Checkout Modal' },
            { key: 'F4', desc: 'Hold Current Sale Snapshot' },
            { key: 'F5', desc: 'View & Resume Held Sales List' },
            { key: 'F9', desc: 'Clear Active Cart' },
            { key: 'Escape', desc: 'Close Modals / Drawers' },
          ].map((sc) => (
            <div key={sc.key} className="pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-800">{sc.desc}</span>
              <kbd className="bg-slate-800 text-white font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
