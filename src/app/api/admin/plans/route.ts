import { planService } from '../../../../features/platform-admin/services/plan.service';
import { validateCreatePlan } from '../../../../features/platform-admin/validators/plan.validator';
import { APIResponse } from '../../../../types/api.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const plans = await planService.getPlans(includeInactive);

    const responsePayload: APIResponse<typeof plans> = {
      success: true,
      statusCode: 200,
      message: 'Subscription plans retrieved successfully',
      data: plans,
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
        errorCode: 'PLANS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch plans',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCreatePlan(body);

    if (!validation.success || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid subscription plan payload',
          details: Object.entries(validation.errors || {}).map(([field, message]) => ({ field, message })),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const plan = await planService.createPlan(validation.data);

    const responsePayload: APIResponse<typeof plan> = {
      success: true,
      statusCode: 201,
      message: 'Subscription plan created successfully',
      data: plan,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        errorCode: 'PLAN_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create plan',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
