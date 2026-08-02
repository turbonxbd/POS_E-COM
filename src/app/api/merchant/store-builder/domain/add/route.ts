import { validateMerchantApiAccess } from '../../../../../../core/auth/merchant-guard';
import { customDomainService } from '../../../../../../features/store-builder/services/domain.service';

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
    const { domainName } = body;

    if (!domainName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "domainName" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const addResult = await customDomainService.addCustomDomain(auth.merchantId, domainName);

    if (!addResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: addResult.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Custom domain registered. Please configure DNS CNAME records.',
        data: addResult.domainConfig,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to add custom domain.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
