import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { storePromotionalService } from '../../../../../features/store-builder/services/promotional.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const promos = await storePromotionalService.getPromotions(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: promos }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch storefront promotional settings.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { announcementBar, popup } = body;

    let updatedPromos = await storePromotionalService.getPromotions(auth.merchantId);

    if (announcementBar) {
      const bar = await storePromotionalService.updateAnnouncementBar(auth.merchantId, announcementBar);
      updatedPromos.announcementBar = bar;
    }

    if (popup) {
      const pop = await storePromotionalService.updatePopup(auth.merchantId, popup);
      updatedPromos.popup = pop;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Promotional settings updated.', data: updatedPromos }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update promotional settings.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
