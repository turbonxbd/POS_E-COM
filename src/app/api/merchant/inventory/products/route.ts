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

    const products = await catalogService.getProducts(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: products }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch products catalog.' }),
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
    const { name, categoryId, brandId, supplierId, description, basePrice, costPrice, sellingPrice, isVariant, variants } = body;

    if (!name || basePrice === undefined || costPrice === undefined || sellingPrice === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters ("name", "basePrice", "costPrice", "sellingPrice").' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newProduct = await catalogService.createProduct(auth.merchantId, {
      name,
      categoryId,
      brandId,
      supplierId,
      description,
      basePrice,
      costPrice,
      sellingPrice,
      isVariant,
      variants,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Product and variants created with auto SKU & Barcodes.', data: newProduct }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create product catalog item.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
