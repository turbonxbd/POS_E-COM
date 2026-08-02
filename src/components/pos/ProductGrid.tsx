import React from 'react';
import { ProductDTO, ProductVariantDTO, CategoryDTO } from '../../types/inventory.types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export interface ProductGridProps {
  products: ProductDTO[];
  categories: CategoryDTO[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onProductClick: (variant: ProductVariantDTO, product: ProductDTO) => void;
  searchQuery?: string;
  stockMap?: Record<string, number>;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onProductClick,
  searchQuery = '',
  stockMap,
}) => {
  // Filter products by selected category and search query
  const filteredProducts = products.filter((product) => {
    const matchCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
    if (!matchCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();

    const matchName = product.name.toLowerCase().includes(q);
    const matchVariant = product.variants?.some(
      (v) =>
        v.variantName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.barcode && v.barcode.toLowerCase().includes(q))
    );

    return matchName || matchVariant;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Category Pills Header */}
      <div className="p-3 bg-white border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedCategoryId === null
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid Area */}
      <div className="flex-1 p-3 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <span className="text-4xl mb-2">🔍</span>
            <p className="font-semibold text-slate-600">No products found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your category filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) =>
              (product.variants || []).map((variant) => {
                const stock = stockMap?.[variant.id] ?? 50;
                const isOutOfStock = stock <= 0;

                return (
                  <Card
                    key={`${product.id}-${variant.id}`}
                    onClick={() => !isOutOfStock && onProductClick(variant, product)}
                    className={`cursor-pointer border transition-all duration-150 flex flex-col justify-between p-3 select-none ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                        : 'hover:shadow-md hover:border-blue-500 bg-white border-slate-200 active:scale-95'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-500 truncate">
                          {variant.sku}
                        </span>
                        {isOutOfStock ? (
                          <Badge variant="error" className="text-[9px] px-1 py-0">
                            Out
                          </Badge>
                        ) : (
                          <Badge
                            variant={stock <= 5 ? 'warning' : 'success'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {stock} in stock
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      {product.isVariant && (
                        <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                          {variant.variantName}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Price</span>
                      <span className="font-extrabold text-sm text-emerald-600">
                        ৳{variant.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
