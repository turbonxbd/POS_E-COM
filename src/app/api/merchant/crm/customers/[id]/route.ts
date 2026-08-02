import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { crmCustomerService } from '../../../../../../features/customer-crm/services/crm-customer.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const customerId = params.id;
    const details = await crmCustomerService.getCustomer360Details(auth.merchantId, customerId);

    if (!details) {
      return new Response(
        JSON.stringify({ success: false, error: `Customer profile "${customerId}" not found.` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: details }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch 360-degree customer details.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const customerId = params.id;
    const body = await request.json();

    const updatedSummary = await crmCustomerService.updateCustomerProfileDetails(
      auth.merchantId,
      customerId,
      body
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Customer profile "${customerId}" updated successfully.`,
        data: updatedSummary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update customer CRM profile.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
