import { dashboardNotificationService } from '../../../../../../../features/merchant-dashboard/services/notification.service';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await dashboardNotificationService.markAsRead('merch-techstore', params.id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Notification with ID "${params.id}" not found.`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification marked as read.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to update notification read status.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
