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

    const suppliers = await catalogService.getSuppliers(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: suppliers }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch suppliers.' }),
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
    const { name, phone, companyName, email, address, taxNumber } = body;

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supplier "name" and "phone" are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newSupplier = await catalogService.createSupplier(auth.merchantId, {
      name,
      phone,
      companyName,
      email,
      address,
      taxNumber,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Supplier created.', data: newSupplier }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create supplier.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
