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
    const threshold = parseInt(searchParams.get('threshold') || '10', 10);

    const cacheKey = `low_stock:${auth.merchantId}:${threshold}`;
    const cachedData = dashboardCache.get(cacheKey);
    if (cachedData) {
      return new Response(
        JSON.stringify({ success: true, cached: true, data: cachedData }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const items = await merchantAnalyticsService.getLowStockAlerts(auth.merchantId, threshold);
    dashboardCache.set(cacheKey, items, 60);

    return new Response(
      JSON.stringify({ success: true, data: items }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch low stock alerts.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
