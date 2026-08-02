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

    const verifyResult = await customDomainService.verifyDomainDNS(auth.merchantId, domainName);

    if (!verifyResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: verifyResult.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        isVerified: verifyResult.isVerified,
        sslStatus: verifyResult.sslStatus,
        message: verifyResult.message,
        dnsRecords: verifyResult.dnsRecords,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to verify custom domain DNS.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
