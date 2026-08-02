import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { crmCustomerService } from '../../../../../features/customer-crm/services/crm-customer.service';
import { CRMExporter } from '../../../../../features/customer-crm/utils/crm-exporter';
import { MembershipTierType } from '../../../../../types/customer-crm.types';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || searchParams.get('q') || undefined;
    const membershipTier = searchParams.get('tier') as MembershipTierType | undefined;
    const minLTV = searchParams.get('minLTV') ? Number(searchParams.get('minLTV')) : undefined;
    const maxLTV = searchParams.get('maxLTV') ? Number(searchParams.get('maxLTV')) : undefined;
    const tag = searchParams.get('tag') || undefined;
    const format = searchParams.get('format') || 'json';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 15;

    const result = await crmCustomerService.queryCustomers(auth.merchantId, {
      searchQuery,
      membershipTier,
      minLTV,
      maxLTV,
      tag,
      page: format === 'csv' ? 1 : page,
      limit: format === 'csv' ? 1000 : limit,
    });

    if (format === 'csv') {
      const csvText = CRMExporter.exportCustomersToCSV(result.customers);
      return new Response(csvText, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="crm_customers_${Date.now()}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to query customer CRM profiles.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
