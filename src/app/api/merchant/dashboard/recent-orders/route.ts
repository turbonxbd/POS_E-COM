import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { merchantAnalyticsService } from '../../../../../features/merchant-dashboard/services/analytics.service';
import { dashboardCache } from '../../../../../lib/dashboard-cache';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const cacheKey = `recent_orders:${auth.merchantId}:${limit}`;
    const cachedData = dashboardCache.get(cacheKey);
    if (cachedData) {
      return new Response(
        JSON.stringify({ success: true, cached: true, data: cachedData }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orders = await merchantAnalyticsService.getRecentOrders(auth.merchantId, limit);
    dashboardCache.set(cacheKey, orders, 30); // 30s TTL

    return new Response(
      JSON.stringify({ success: true, data: orders }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch recent orders.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
