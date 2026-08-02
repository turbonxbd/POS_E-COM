import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { stockAdjustmentService } from '../../../../../features/inventory/services/stock-adjustment.service';

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
    const { warehouseId, variantId, adjustmentType, quantity, reason, notes } = body;

    if (!warehouseId || !variantId || !adjustmentType || quantity === undefined || !reason) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters ("warehouseId", "variantId", "adjustmentType", "quantity", "reason").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await stockAdjustmentService.adjustStock(auth.merchantId, {
      warehouseId,
      variantId,
      adjustmentType,
      quantity,
      reason,
      notes,
      createdBy: auth.user?.name || 'merchant-staff',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stock adjusted successfully.',
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to adjust stock.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
