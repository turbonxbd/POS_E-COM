import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { barcodeRenderService } from '../../../../../features/barcode/services/barcode-render.service';

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
    const { code, symbology } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "code" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = barcodeRenderService.generateBarcodeSVG(code, symbology || 'CODE128');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate single barcode SVG.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
