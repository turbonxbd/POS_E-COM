import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { merchantAnalyticsService } from '../../../../../features/merchant-dashboard/services/analytics.service';
import { dashboardCache } from '../../../../../lib/dashboard-cache';
import { TimeframeType } from '../../../../../types/merchant-dashboard.types';

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
    const timeframe = (searchParams.get('timeframe') as TimeframeType) || 'THIS_MONTH';

    const cacheKey = `stats:${auth.merchantId}:${timeframe}`;
    const cachedData = dashboardCache.get(cacheKey);
    if (cachedData) {
      return new Response(
        JSON.stringify({ success: true, cached: true, data: cachedData }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const kpis = await merchantAnalyticsService.getOverviewKPIs(auth.merchantId, timeframe);
    dashboardCache.set(cacheKey, kpis, 60); // 60s TTL

    return new Response(
      JSON.stringify({ success: true, data: kpis }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch dashboard stats.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
