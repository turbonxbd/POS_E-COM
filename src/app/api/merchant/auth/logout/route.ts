import { destroySessionCookie } from '../../../../../lib/session';

export async function POST() {
  try {
    const expiredCookie = destroySessionCookie();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully. Session destroyed.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': expiredCookie,
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to logout session.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
