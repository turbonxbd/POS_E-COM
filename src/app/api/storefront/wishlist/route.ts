import { wishlistService } from '../../../../features/customer-website/services/wishlist.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || 'cust-101';

    const wishlist = await wishlistService.getCustomerWishlist(customerId);

    return new Response(
      JSON.stringify({ success: true, data: wishlist }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer wishlist.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId = 'cust-101', variantId, guestVariantIds } = body;

    // Guest wishlist sync upon login
    if (guestVariantIds && Array.isArray(guestVariantIds)) {
      const syncedList = await wishlistService.syncGuestWishlist(customerId, guestVariantIds);
      return new Response(
        JSON.stringify({ success: true, message: 'Guest wishlist synced to account.', data: syncedList }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!variantId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "variantId" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await wishlistService.toggleWishlist(customerId, variantId);

    return new Response(
      JSON.stringify({ success: true, message: result.message, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update wishlist item.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || 'cust-101';
    const variantId = searchParams.get('variantId');

    if (!variantId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "variantId" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const removed = await wishlistService.removeFromWishlist(customerId, variantId);

    return new Response(
      JSON.stringify({ success: true, message: removed ? 'Item removed from wishlist.' : 'Item not found in wishlist.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to remove wishlist item.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
