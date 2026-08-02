import React, { useState } from 'react';
import { CategoryDTO } from '../../types/inventory.types';

export interface StoreHeaderProps {
  storeName: string;
  logoUrl?: string | null;
  announcementText?: string | null;
  categories: CategoryDTO[];
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  wishlistCount: number;
  cartItemCount: number;
  onOpenCartDrawer: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onSelectCategory: (catId: string | null) => void;
  selectedCategoryId: string | null;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  storeName,
  logoUrl,
  announcementText = '🚚 Free Delivery across Bangladesh on orders over ৳3,000!',
  categories,
  searchQuery,
  onSearchQueryChange,
  wishlistCount,
  cartItemCount,
  onOpenCartDrawer,
  onOpenWishlist,
  onOpenAccount,
  onOpenTracking,
  onSelectCategory,
  selectedCategoryId,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      {/* Top Announcement Bar */}
      {announcementText && (
        <div className="bg-slate-900 text-white text-center text-xs py-2 px-4 font-medium flex items-center justify-center gap-2">
          <span>{announcementText}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-700 text-xl p-1"
          >
            ☰
          </button>

          <a href="#" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-9 object-contain" />
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                🛍️
              </div>
            )}
            <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
              {storeName}
            </span>
          </a>
        </div>

        {/* Middle: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search products, brands, gadgets..."
            className="w-full bg-slate-100 border border-slate-300 rounded-full px-4 py-2 pl-10 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Action Buttons (Track, Wishlist, Account, Cart) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenTracking}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>🚚</span>
            <span>Track Order</span>
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative p-2 text-slate-700 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Wishlist"
          >
            <span className="text-lg">❤️</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            className="p-2 text-slate-700 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Account Portal"
          >
            <span className="text-lg">👤</span>
          </button>

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenCartDrawer}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span>🛒 Cart</span>
            {cartItemCount > 0 && (
              <span className="bg-white text-blue-700 font-extrabold text-[11px] px-1.5 py-0.5 rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Sub-Navigation Bar */}
      <div className="border-t border-slate-100 bg-slate-50/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 py-2 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`transition-colors ${
              selectedCategoryId === null ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap transition-colors ${
                selectedCategoryId === cat.id ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
