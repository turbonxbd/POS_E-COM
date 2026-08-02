import React from 'react';
import { ProductDTO } from '../../types/inventory.types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ProductCardProps {
  product: ProductDTO;
  onProductClick: (product: ProductDTO) => void;
  onAddToCart: (product: ProductDTO) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}) => {
  const defaultVariant = product.variants?.[0];
  const hasDiscount = product.basePrice > product.sellingPrice;
  const discountVal = hasDiscount
    ? Math.round(((product.basePrice - product.sellingPrice) / product.basePrice) * 100)
    : 0;

  return (
    <Card className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between select-none">
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge variant="error" className="text-[10px] font-extrabold uppercase px-2 py-0.5 shadow-sm">
            {discountVal}% OFF
          </Badge>
        </div>
      )}

      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-sm shadow-xs hover:scale-110 transition-transform"
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        {isWishlisted ? '❤️' : '🤍'}
      </button>

      {/* Product Image Container */}
      <div
        onClick={() => onProductClick(product)}
        className="cursor-pointer aspect-square w-full bg-slate-100 overflow-hidden relative flex items-center justify-center p-4"
      >
        <img
          src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=80"
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details Area */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mb-1">
            <span>★ 4.9</span>
            <span className="text-slate-400 font-normal text-[10px]">(12 reviews)</span>
          </div>

          <h3
            onClick={() => onProductClick(product)}
            className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
          >
            {product.name}
          </h3>

          <p className="text-[11px] text-slate-400 font-mono mt-1">
            {defaultVariant?.sku || 'SKU-GEN'}
          </p>
        </div>

        {/* Pricing & Cart Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="font-extrabold text-sm sm:text-base text-emerald-600">
              ৳{product.sellingPrice.toLocaleString()}
            </div>
            {hasDiscount && (
              <div className="text-[11px] text-slate-400 line-through">
                ৳{product.basePrice.toLocaleString()}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => onAddToCart(product)}
            className="text-xs font-bold py-1.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            + Add
          </Button>
        </div>
      </div>
    </Card>
  );
};
