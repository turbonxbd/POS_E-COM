import { merchantService } from '../../../../../features/platform-admin/services/merchant.service';
import { validateUpdateMerchant } from '../../../../../features/platform-admin/validators/merchant.validator';
import { APIResponse } from '../../../../../types/api.types';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const merchant = await merchantService.getMerchantById(params.id);
    if (!merchant) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `Merchant with ID "${params.id}" not found`,
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const responsePayload: APIResponse<typeof merchant> = {
      success: true,
      statusCode: 200,
      message: 'Merchant details retrieved',
      data: merchant,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        errorCode: 'MERCHANT_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Error fetching merchant',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const validation = validateUpdateMerchant(body);

    if (!validation.success || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid merchant update payload',
          details: Object.entries(validation.errors || {}).map(([field, message]) => ({ field, message })),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await merchantService.updateMerchant(params.id, validation.data);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: 'Merchant updated successfully',
      data: updated,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        errorCode: 'MERCHANT_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update merchant',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const deleted = await merchantService.deleteMerchant(params.id, hardDelete);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `Merchant with ID "${params.id}" not found`,
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: hardDelete ? 'Merchant permanently deleted' : 'Merchant soft deleted',
        data: null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        errorCode: 'MERCHANT_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete merchant',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
