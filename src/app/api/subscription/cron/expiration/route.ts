import { subscriptionExpirationCron } from '../../../../../features/subscription/cron/expiration.cron';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.includes('Bearer ag_cron_secret') && process.env.NODE_ENV === 'production') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized background cron execution trigger.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = await subscriptionExpirationCron.runExpirationCheck([]);

    return new Response(
      JSON.stringify({
        success: true,
        data: summary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to execute subscription expiration cron task.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
