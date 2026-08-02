import { merchantService } from '../../../../features/platform-admin/services/merchant.service';
import { validateCreateMerchant } from '../../../../features/platform-admin/validators/merchant.validator';
import { APIResponse } from '../../../../types/api.types';
import { MerchantStatus } from '../../../../types/platform-admin.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as MerchantStatus) || undefined;
    const planId = searchParams.get('planId') || undefined;

    const result = await merchantService.searchMerchants({
      page,
      pageSize,
      search,
      status,
      planId,
    });

    const responsePayload: APIResponse<typeof result> = {
      success: true,
      statusCode: 200,
      message: 'Merchants retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorPayload = {
      success: false,
      statusCode: 500,
      errorCode: 'MERCHANT_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch merchants',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCreateMerchant(body);

    if (!validation.success || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid merchant provisioning payload',
          details: Object.entries(validation.errors || {}).map(([field, message]) => ({ field, message })),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const merchant = await merchantService.createMerchant(validation.data);

    const responsePayload: APIResponse<typeof merchant> = {
      success: true,
      statusCode: 201,
      message: 'Merchant provisioned successfully',
      data: merchant,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorPayload = {
      success: false,
      statusCode: 400,
      errorCode: 'MERCHANT_CREATE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to provision merchant',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
