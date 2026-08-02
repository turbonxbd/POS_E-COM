import { passwordResetService } from '../../../../../features/merchant-auth/services/password-reset.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone } = body;

    if (!emailOrPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter "emailOrPhone" is required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resetResult = await passwordResetService.requestPasswordReset(emailOrPhone);

    return new Response(
      JSON.stringify({
        success: resetResult.success,
        message: resetResult.message,
        error: resetResult.error,
      }),
      { status: resetResult.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to request password reset.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
