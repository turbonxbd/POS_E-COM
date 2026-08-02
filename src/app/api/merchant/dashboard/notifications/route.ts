import { dashboardNotificationService } from '../../../../../features/merchant-dashboard/services/notification.service';

export async function GET() {
  try {
    const notifications = await dashboardNotificationService.getNotifications('merch-techstore');

    return new Response(
      JSON.stringify({
        success: true,
        data: notifications,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch dashboard notifications.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
