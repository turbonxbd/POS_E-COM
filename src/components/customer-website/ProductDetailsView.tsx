import React, { useState } from 'react';
import { ProductDTO, ProductVariantDTO } from '../../types/inventory.types';
import { ReviewSummary } from '../../types/customer-website.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface ProductDetailsViewProps {
  product: ProductDTO;
  onAddToCart: (product: ProductDTO, variant: ProductVariantDTO, quantity: number) => void;
  onBuyNow: (product: ProductDTO, variant: ProductVariantDTO, quantity: number) => void;
  reviewSummary?: ReviewSummary;
  onSubmitReview?: (rating: number, text: string) => Promise<void>;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  reviewSummary = {
    productId: product.id,
    averageRating: 4.9,
    totalReviews: 12,
    ratingDistribution: { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 },
    reviews: [
      {
        id: 'rev-1',
        productId: product.id,
        customerId: 'cust-1',
        customerName: 'Karim Ahmed',
        rating: 5,
        reviewText: '100% Genuine product! Packaging was great and delivered in 24 hours in Dhaka.',
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  onSubmitReview,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDTO>(
    product.variants?.[0] || {
      id: 'var-default',
      productId: product.id,
      sku: 'SKU-DEFAULT',
      variantName: 'Default Variant',
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      attributes: {},
    }
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitReview || !newReviewText.trim()) return;

    try {
      setIsSubmittingReview(true);
      await onSubmitReview(newRating, newReviewText);
      setNewReviewText('');
      alert('Review submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Product Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden p-6 flex items-center justify-center border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80"
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Right Column: Title, Pricing, Variant Selectors, CTAs */}
        <div className="space-y-5">
          <div>
            <Badge variant="success" className="mb-2">
              In Stock & Ready to Ship
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              SKU: <span className="text-slate-800 font-semibold">{selectedVariant.sku}</span>
            </p>
          </div>

          {/* Rating Summary Header */}
          <div className="flex items-center gap-2">
            <div className="flex text-amber-500 text-sm">★★★★★</div>
            <span className="font-bold text-xs text-slate-800">
              {reviewSummary.averageRating} / 5.0
            </span>
            <span className="text-xs text-slate-400">
              ({reviewSummary.totalReviews} Customer Reviews)
            </span>
          </div>

          {/* Price Tag */}
          <div className="flex items-baseline gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              ৳{selectedVariant.sellingPrice.toLocaleString()}
            </span>
            {product.basePrice > selectedVariant.sellingPrice && (
              <span className="text-sm text-slate-400 line-through">
                ৳{product.basePrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Variant Selector (if product has multiple variants) */}
          {product.isVariant && product.variants && product.variants.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Variant Option</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedVariant.id === v.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {v.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Adjuster */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Quantity</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  -
                </button>
                <span className="px-4 py-1 text-sm font-bold text-slate-900 bg-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddToCart(product, selectedVariant, quantity)}
              className="py-3 font-bold text-xs bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100"
            >
              🛒 Add to Cart
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => onBuyNow(product, selectedVariant, quantity)}
              className="py-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              ⚡ Buy Now
            </Button>
          </div>

          {/* Shipping Charges Estimator Widget */}
          <Card className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>🚚</span>
              <span>Delivery Charge Estimator:</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Inside Dhaka City:</span>
              <span className="font-bold text-slate-900">৳70 (24-48 Hours)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Outside Dhaka (All Districts):</span>
              <span className="font-bold text-slate-900">৳130 (2-4 Days)</span>
            </div>
            <p className="text-[11px] text-blue-600 font-semibold pt-1">
              ✨ Free Shipping automatically applied on orders over ৳3,000!
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs: Description vs Reviews */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex border-b border-slate-200 gap-6 text-sm font-bold mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`pb-3 transition-all ${
              activeTab === 'description'
                ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Overview & Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-all ${
              activeTab === 'reviews'
                ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({reviewSummary.totalReviews})
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="prose text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
            <p>
              {product.description ||
                'Experience official premium quality built for daily usage. High grade materials, long lasting warranty coverage, and high performance specifications verified for Bangladesh consumers.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reviews List */}
            <div className="space-y-4 divide-y divide-slate-100">
              {reviewSummary.reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-amber-500 text-xs">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.reviewText}</p>
                </div>
              ))}
            </div>

            {/* Write a Review Form */}
            {onSubmitReview && (
              <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900">Write a Customer Review</h4>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Select Star Rating</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold bg-slate-50"
                  >
                    <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                    <option value={4}>★★★★☆ (4 Stars - Good)</option>
                    <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                    <option value={2}>★★☆☆☆ (2 Stars - Below Average)</option>
                    <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                  </select>
                </div>

                <div>
                  <textarea
                    required
                    rows={3}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingReview}
                  className="text-xs font-bold py-2 px-5"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
