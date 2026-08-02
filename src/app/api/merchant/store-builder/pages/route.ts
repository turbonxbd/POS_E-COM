import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { storePageService } from '../../../../../features/store-builder/services/page.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pages = await storePageService.getCustomPages(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: pages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch custom pages.' }),
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
    const { action, title, slug, contentHtml, isPublished, metaTitle, metaDescription, id } = body;

    // Handle Auto-Generation of Policy Templates
    if (action === 'GENERATE_POLICIES') {
      const generated = await storePageService.generateDefaultPolicyPages(auth.merchantId, body.storeName || 'Our Store');
      return new Response(
        JSON.stringify({ success: true, message: 'Default Bangladesh e-commerce policy pages generated.', data: generated }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !slug || !contentHtml) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameters "title", "slug", and "contentHtml" are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const savedPage = await storePageService.createOrUpdatePage(auth.merchantId, {
      id,
      merchantId: auth.merchantId,
      title,
      slug,
      contentHtml,
      isPublished: isPublished !== undefined ? isPublished : true,
      metaTitle,
      metaDescription,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Custom page saved.', data: savedPage }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to save custom page.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
