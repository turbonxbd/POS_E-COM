import { analyticsService } from '../../../../../features/platform-admin/services/analytics.service';
import { Merchant, PlatformRevenue } from '../../../../../types/platform-admin.types';
import { APIResponse } from '../../../../../types/api.types';

// Initial sample data for demonstration / development fallback
const mockMerchants: Merchant[] = [
  {
    id: 'm1',
    name: 'TechStore BD',
    slug: 'techstore-bd',
    ownerName: 'Rahim Ahmed',
    email: 'rahim@techstore.com',
    status: 'ACTIVE',
    planId: 'plan-pro',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    name: 'Fashion Hub',
    slug: 'fashion-hub',
    ownerName: 'Nusrat Jahan',
    email: 'nusrat@fashionhub.com',
    status: 'ACTIVE',
    planId: 'plan-enterprise',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm3',
    name: 'Gadget Express',
    slug: 'gadget-express',
    ownerName: 'Tanvir Hossain',
    email: 'tanvir@gadget.com',
    status: 'PENDING',
    planId: 'plan-starter',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockRevenues: PlatformRevenue[] = [
  {
    id: 'rev-1',
    merchantId: 'm1',
    planId: 'plan-pro',
    amount: 49.0,
    currency: 'USD',
    paymentMethod: 'Stripe',
    transactionId: 'tx_1001',
    status: 'SUCCESS',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'rev-2',
    merchantId: 'm2',
    planId: 'plan-enterprise',
    amount: 199.0,
    currency: 'USD',
    paymentMethod: 'bKash',
    transactionId: 'tx_1002',
    status: 'SUCCESS',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function GET() {
  try {
    const overview = await analyticsService.getMetricsOverview(mockMerchants, mockRevenues);

    const responsePayload: APIResponse<typeof overview> = {
      success: true,
      statusCode: 200,
      message: 'Platform analytics overview fetched successfully',
      data: overview,
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
      errorCode: 'ANALYTICS_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch analytics overview',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
