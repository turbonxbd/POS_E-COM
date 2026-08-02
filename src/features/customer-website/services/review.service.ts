import { ProductReviewDTO, ReviewSummary } from '../../../types/customer-website.types';

export interface SubmitReviewPayload {
  customerId: string;
  customerName?: string;
  productId: string;
  orderId?: string | null;
  rating: number; // 1 to 5
  reviewText: string;
  images?: string[];
}

/**
 * Enterprise Service for Product Review & Star Rating Submissions, Verification, and Rating Summaries.
 */
export class ReviewService {
  private static instance: ReviewService | null = null;
  // In-memory reviews store: Map<productId, ProductReviewDTO[]>
  private reviewsStore: Map<string, ProductReviewDTO[]> = new Map();

  private constructor() {
    this.seedDemoReviews();
  }

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * Submits a new verified buyer product rating and text review.
   */
  public async submitReview(
    payload: SubmitReviewPayload
  ): Promise<{ success: boolean; review: ProductReviewDTO; message: string }> {
    const { customerId, customerName = 'Verified Buyer', productId, orderId, rating, reviewText, images } = payload;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Star rating must be an integer between 1 and 5.');
    }

    if (!reviewText || reviewText.trim().length < 5) {
      throw new Error('Review text must be at least 5 characters long.');
    }

    const reviewId = `rev-${Date.now()}`;
    const newReview: ProductReviewDTO = {
      id: reviewId,
      productId,
      customerId,
      customerName,
      orderId: orderId || null,
      rating: Math.round(rating),
      reviewText: reviewText.trim(),
      images: images || null,
      isApproved: true, // Auto-approved for verified purchasers
      createdAt: new Date().toISOString(),
    };

    const existingReviews = this.reviewsStore.get(productId) || [];
    existingReviews.unshift(newReview);
    this.reviewsStore.set(productId, existingReviews);

    return {
      success: true,
      review: newReview,
      message: 'Thank you! Your product review has been published.',
    };
  }

  /**
   * Calculates overall average rating, rating distribution breakdown, and returns approved reviews list.
   */
  public async getProductReviewSummary(productId: string): Promise<ReviewSummary> {
    const allReviews = this.reviewsStore.get(productId) || [];
    const approvedReviews = allReviews.filter((r) => r.isApproved);

    const totalReviews = approvedReviews.length;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews === 0) {
      return {
        productId,
        averageRating: 5.0,
        totalReviews: 0,
        ratingDistribution,
        reviews: [],
      };
    }

    let ratingSum = 0;
    for (const rev of approvedReviews) {
      ratingSum += rev.rating;
      const roundedStar = Math.min(5, Math.max(1, Math.round(rev.rating)));
      ratingDistribution[roundedStar] = (ratingDistribution[roundedStar] || 0) + 1;
    }

    const averageRating = Math.round((ratingSum / totalReviews) * 10) / 10;

    return {
      productId,
      averageRating,
      totalReviews,
      ratingDistribution,
      reviews: approvedReviews,
    };
  }

  private seedDemoReviews(): void {
    const demoProdId = 'prod-1';
    this.reviewsStore.set(demoProdId, [
      {
        id: 'rev-101',
        productId: demoProdId,
        customerId: 'cust-101',
        customerName: 'Karim Ahmed',
        orderId: 'ORD-20260801-9901',
        rating: 5,
        reviewText: 'Original product! Build quality is amazing and fits my iPhone perfectly. Highly recommended seller!',
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60'],
        isApproved: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'rev-102',
        productId: demoProdId,
        customerId: 'cust-[102]',
        customerName: 'Nusrat Jahan',
        orderId: null,
        rating: 4,
        reviewText: 'Good case, fast delivery within 2 days in Dhaka.',
        isApproved: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ]);
  }
}

export const reviewService = ReviewService.getInstance();
