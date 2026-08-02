import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { catalogService } from '../../../../../features/inventory/services/catalog.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const categories = await catalogService.getCategories(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: categories }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch categories.' }),
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
    const { name, parentId, imageUrl } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category "name" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newCat = await catalogService.createCategory(auth.merchantId, { name, parentId, imageUrl });

    return new Response(
      JSON.stringify({ success: true, message: 'Category created.', data: newCat }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create category.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
