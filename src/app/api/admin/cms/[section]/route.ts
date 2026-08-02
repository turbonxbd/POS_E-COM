import { cmsService } from '../../../../../features/platform-admin/services/cms.service';
import { CMSSection } from '../../../../../types/platform-admin.types';
import { APIResponse } from '../../../../../types/api.types';

const VALID_SECTIONS: CMSSection[] = ['HERO', 'PRICING', 'FAQ', 'BLOG', 'TERMS', 'PRIVACY', 'FOOTER'];

export async function GET(_request: Request, { params }: { params: { section: string } }) {
  try {
    const sectionUpper = params.section.toUpperCase() as CMSSection;

    if (!VALID_SECTIONS.includes(sectionUpper)) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'INVALID_SECTION',
          message: `Invalid CMS section "${params.section}". Allowed: ${VALID_SECTIONS.join(', ')}`,
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cmsContent = await cmsService.getCMSSection(sectionUpper);

    const responsePayload: APIResponse<typeof cmsContent> = {
      success: true,
      statusCode: 200,
      message: `CMS section "${sectionUpper}" retrieved successfully`,
      data: cmsContent,
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
        errorCode: 'CMS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch CMS content',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { section: string } }) {
  try {
    const sectionUpper = params.section.toUpperCase() as CMSSection;

    if (!VALID_SECTIONS.includes(sectionUpper)) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'INVALID_SECTION',
          message: `Invalid CMS section "${params.section}"`,
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updated = await cmsService.updateCMSSection(sectionUpper, body);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: `CMS section "${sectionUpper}" updated successfully`,
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
        errorCode: 'CMS_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update CMS content',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
