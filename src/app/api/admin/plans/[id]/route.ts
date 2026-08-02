import { planService } from '../../../../../features/platform-admin/services/plan.service';
import { validateUpdatePlan } from '../../../../../features/platform-admin/validators/plan.validator';
import { APIResponse } from '../../../../../types/api.types';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await planService.getPlanById(params.id);
    if (!plan) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `Plan with ID "${params.id}" not found`,
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const responsePayload: APIResponse<typeof plan> = {
      success: true,
      statusCode: 200,
      message: 'Plan details retrieved successfully',
      data: plan,
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
        errorCode: 'PLAN_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch plan',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const validation = validateUpdatePlan(body);

    if (!validation.success || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid plan update payload',
          details: Object.entries(validation.errors || {}).map(([field, message]) => ({ field, message })),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await planService.updatePlan(params.id, validation.data);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: 'Plan updated successfully',
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
        errorCode: 'PLAN_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update plan',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const deleted = await planService.deletePlan(params.id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `Plan with ID "${params.id}" not found`,
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: 'Plan deleted successfully',
        data: null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        errorCode: 'PLAN_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete plan',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
