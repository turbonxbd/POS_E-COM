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

    const brands = await catalogService.getBrands(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: brands }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch brands.' }),
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
    const { name, logoUrl } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Brand "name" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newBrand = await catalogService.createBrand(auth.merchantId, { name, logoUrl });

    return new Response(
      JSON.stringify({ success: true, message: 'Brand created.', data: newBrand }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create brand.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
