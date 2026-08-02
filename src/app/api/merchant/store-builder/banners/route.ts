import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { storeBannerService } from '../../../../../features/store-builder/services/banner.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const banners = await storeBannerService.getBanners(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: banners }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch storefront banners.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { title, subtitle, imageUrl, linkUrl, ctaText, sortOrder } = body;

    if (!title || !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameters "title" and "imageUrl" are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newBanner = await storeBannerService.createBanner(auth.merchantId, {
      title,
      subtitle,
      imageUrl,
      linkUrl,
      ctaText,
      sortOrder,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Hero banner slide created.', data: newBanner }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create storefront banner.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
