import { brandService } from '../../../../features/platform-admin/services/brand.service';
import { APIResponse } from '../../../../types/api.types';

export async function GET() {
  try {
    const settings = await brandService.getBrandSettings();

    const responsePayload: APIResponse<typeof settings> = {
      success: true,
      statusCode: 200,
      message: 'Platform brand settings retrieved successfully',
      data: settings,
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
        errorCode: 'BRAND_SETTINGS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch brand settings',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await brandService.updateBrandSettings(body);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: 'Platform brand settings updated successfully',
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
        errorCode: 'BRAND_SETTINGS_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update brand settings',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
