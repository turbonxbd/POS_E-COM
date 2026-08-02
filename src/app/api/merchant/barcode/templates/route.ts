import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { barcodeTemplateService } from '../../../../../features/barcode/services/template.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const templates = await barcodeTemplateService.getTemplates(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: templates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch barcode templates.' }),
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
    const { name, widthMm, heightMm, labelsPerRow, showStoreName, showProductName, showPrice, showSKU, showVariantName, isDefault } = body;

    if (!name || !widthMm || !heightMm) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameters "name", "widthMm", and "heightMm" are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newTemplate = await barcodeTemplateService.createTemplate(auth.merchantId, {
      name,
      widthMm,
      heightMm,
      labelsPerRow,
      showStoreName,
      showProductName,
      showPrice,
      showSKU,
      showVariantName,
      isDefault,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Barcode template created.', data: newTemplate }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to create barcode template.' }),
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
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "id" is required for template update.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedTemplate = await barcodeTemplateService.updateTemplate(auth.merchantId, id, updateData);

    return new Response(
      JSON.stringify({ success: true, message: 'Barcode template updated.', data: updatedTemplate }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update barcode template.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
