import { passwordResetService } from '../../../../../features/merchant-auth/services/password-reset.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, code, newPassword } = body;

    if (!identifier || !code || !newPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "identifier", "code", and "newPassword" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resetResult = await passwordResetService.resetPassword(identifier, code, newPassword);

    return new Response(
      JSON.stringify({
        success: resetResult.success,
        message: resetResult.message,
      }),
      { status: resetResult.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to complete password reset.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
