import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { storeSEOService } from '../../../../../features/store-builder/services/seo.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const seoConfig = await storeSEOService.getStoreSEO(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: seoConfig }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch store SEO configuration.' }),
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
    const { socialLinks, seoMetadata } = body;

    let updatedSEO = await storeSEOService.getStoreSEO(auth.merchantId);

    if (socialLinks) {
      updatedSEO = await storeSEOService.updateSocialLinks(auth.merchantId, socialLinks);
    }
    if (seoMetadata) {
      updatedSEO = await storeSEOService.updateStoreSEO(auth.merchantId, seoMetadata);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'SEO and Social configuration updated.', data: updatedSEO }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update store SEO configuration.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
