import { reviewService } from '../../../../features/customer-website/services/review.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId = 'cust-101', customerName, productId, orderId, rating, reviewText, images } = body;

    if (!productId || rating === undefined || !reviewText) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "productId", "rating", and "reviewText" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await reviewService.submitReview({
      customerId,
      customerName,
      productId,
      orderId,
      rating: Number(rating),
      reviewText,
      images,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result.review,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to submit product review.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query parameter "productId" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = await reviewService.getProductReviewSummary(productId);

    return new Response(
      JSON.stringify({ success: true, data: summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch product review summary.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
