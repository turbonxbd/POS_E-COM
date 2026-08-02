'use client';

import React, { useState, useEffect } from 'react';
import { ProductDTO, ProductVariantDTO, CategoryDTO } from '../../../types/inventory.types';
import { CartState, CheckoutFormPayload, CustomerWishlistDTO, StorefrontCartItem } from '../../../types/customer-website.types';
import { catalogQueryService } from '../../../features/customer-website/services/catalog-query.service';
import { catalogService } from '../../../features/inventory/services/catalog.service';
import { storefrontCartService } from '../../../features/customer-website/services/cart.service';
import { shippingService } from '../../../features/customer-website/services/shipping.service';
import { storefrontCheckoutService } from '../../../features/customer-website/services/checkout.service';
import { wishlistService } from '../../../features/customer-website/services/wishlist.service';
import { trackingService } from '../../../features/customer-website/services/tracking.service';
import { customerAccountService } from '../../../features/customer-website/services/customer-account.service';

import { StoreHeader } from '../../../components/customer-website/StoreHeader';
import { HeroSection } from '../../../components/customer-website/HeroSection';
import { ProductCard } from '../../../components/customer-website/ProductCard';
import { ProductDetailsView } from '../../../components/customer-website/ProductDetailsView';
import { CartDrawer } from '../../../components/customer-website/CartDrawer';
import { CheckoutView } from '../../../components/customer-website/CheckoutView';
import { OrderTrackingView } from '../../../components/customer-website/OrderTrackingView';
import { CustomerDashboardView } from '../../../components/customer-website/CustomerDashboardView';
import { Modal } from '../../../components/ui/Modal';

export default function StorefrontHomePage() {
  const merchantId = 'merch-techstore';
  const customerId = 'cust-101';

  // Catalog States
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Wishlist States
  const [cartItems, setCartItems] = useState<StorefrontCartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<CustomerWishlistDTO[]>([]);

  // Navigation View & Modal States
  const [currentView, setCurrentView] = useState<'home' | 'product_detail' | 'checkout' | 'tracking' | 'account'>('home');
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      try {
        const prodResult = await catalogQueryService.queryProducts(merchantId, {});
        const catList = await catalogService.getCategories(merchantId);
        const wishList = await wishlistService.getCustomerWishlist(customerId);

        setProducts(prodResult.products);
        setCategories(catList);
        setWishlistItems(wishList);
      } catch (err) {
        console.error('Error loading storefront catalog:', err);
      }
    }
    loadData();
  }, []);

  // Cart Summary Calculation
  const shippingRes = shippingService.calculateShippingFee('Dhaka', 'Dhaka', 0);
  const cartState: CartState = storefrontCartService.calculateCartTotals(
    cartItems,
    couponCode,
    shippingRes.shippingFee
  );

  // Handlers
  const handleAddToCart = (product: ProductDTO, selectedVariant?: ProductVariantDTO, quantity: number = 1) => {
    const variant = selectedVariant || product.variants?.[0];
    if (!variant) return;

    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.variantId === variant.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += quantity;
        updated[idx].lineTotal = updated[idx].quantity * updated[idx].unitPrice;
        return updated;
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantName: variant.variantName,
          sku: variant.sku,
          unitPrice: variant.sellingPrice,
          quantity,
          stockAvailable: 50,
          lineTotal: quantity * variant.sellingPrice,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleToggleWishlist = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const variantId = prod?.variants?.[0]?.id || 'var-101';
    const res = await wishlistService.toggleWishlist(customerId, variantId);
    const updated = await wishlistService.getCustomerWishlist(customerId);
    setWishlistItems(updated);
    alert(res.message);
  };

  const handlePlaceOrder = async (payload: CheckoutFormPayload) => {
    const res = await storefrontCheckoutService.processStorefrontCheckout(payload);
    alert(res.message);
    setCartItems([]);
    setCouponCode(null);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Store Navigation Header */}
      <StoreHeader
        storeName="TechStore Bangladesh"
        categories={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        wishlistCount={wishlistItems.length}
        cartItemCount={cartState.itemCount}
        onOpenCartDrawer={() => setIsCartOpen(true)}
        onOpenWishlist={() => setCurrentView('account')}
        onOpenAccount={() => setCurrentView('account')}
        onOpenTracking={() => setCurrentView('tracking')}
        onSelectCategory={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div>
            <HeroSection onCtaClick={() => setSelectedCategoryId(null)} />

            {/* Shop Product Cards Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedCategoryId
                      ? categories.find((c) => c.id === selectedCategoryId)?.name || 'Category Collection'
                      : 'Featured Product Collection'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Warranty Guaranteed • Express Delivery in Bangladesh
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {products
                  .filter((p) => (!selectedCategoryId || p.categoryId === selectedCategoryId) && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={(p) => {
                        setSelectedProduct(p);
                        setCurrentView('product_detail');
                      }}
                      onAddToCart={(p) => handleAddToCart(p)}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlistItems.some((w) => w.variantId === product.variants?.[0]?.id)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'product_detail' && selectedProduct && (
          <ProductDetailsView
            product={selectedProduct}
            onAddToCart={(prod, variant, qty) => handleAddToCart(prod, variant, qty)}
            onBuyNow={(prod, variant, qty) => {
              handleAddToCart(prod, variant, qty);
              setCurrentView('checkout');
            }}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView
            cart={cartState}
            onPlaceOrder={handlePlaceOrder}
          />
        )}

        {currentView === 'tracking' && (
          <OrderTrackingView
            onTrackSubmit={async (ordNum, phone) => {
              return await trackingService.trackOrder(merchantId, ordNum, phone);
            }}
          />
        )}

        {currentView === 'account' && (
          <CustomerDashboardView
            customer={{
              id: customerId,
              merchantId,
              name: 'Karim Ahmed',
              phone: '+8801700112233',
              email: 'karim@gmail.com',
              isVerified: true,
            }}
            orders={[
              {
                id: 'ord-demo-1001',
                orderNumber: 'ORD-20260801-9901',
                trackingNumber: 'TRK-BD-880192',
                recipientName: 'Karim Ahmed',
                recipientPhone: '+8801700112233',
                grandTotal: 2870,
                paymentMethod: 'COD',
                currentStatus: 'PROCESSING',
                estimatedDeliveryDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                itemCount: 2,
              },
            ]}
            wishlist={wishlistItems}
            onDownloadInvoice={async (orderId) => {
              const html = await customerAccountService.generateOrderInvoiceHTML(customerId, orderId);
              const win = window.open('', '_blank');
              if (win) {
                win.document.write(html);
                win.document.close();
              }
            }}
            onRemoveWishlist={handleToggleWishlist}
          />
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cartState}
        onUpdateQuantity={(vId, qty) => {
          if (qty <= 0) {
            setCartItems((prev) => prev.filter((i) => i.variantId !== vId));
          } else {
            setCartItems((prev) =>
              prev.map((i) => (i.variantId === vId ? { ...i, quantity: qty, lineTotal: qty * i.unitPrice } : i))
            );
          }
        }}
        onRemoveItem={(vId) => setCartItems((prev) => prev.filter((i) => i.variantId !== vId))}
        onApplyCoupon={async (code) => {
          const res = storefrontCartService.validateCoupon(code, cartState.subtotal);
          if (res.isValid) {
            setCouponCode(res.code || code);
            alert(res.message);
          } else {
            throw new Error(res.message);
          }
        }}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-extrabold text-sm mb-3">TechStore BD</h3>
            <p className="leading-relaxed">Official storefront powering high-performance tech gadget retail in Bangladesh.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Customer Care</h4>
            <ul className="space-y-1">
              <li><a href="#" onClick={() => setCurrentView('tracking')}>Track My Order</a></li>
              <li><a href="#">Return & Refund Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Payment Methods</h4>
            <p className="leading-relaxed">We accept bKash, Nagad, Rocket, Visa, Mastercard, and Cash on Delivery.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Helpline Support</h4>
            <p className="text-white font-bold text-sm">+880 1711-002233</p>
            <p className="text-slate-500 mt-1">10:00 AM - 10:00 PM (Everyday)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
