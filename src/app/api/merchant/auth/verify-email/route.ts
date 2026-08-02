import { verificationService } from '../../../../../features/merchant-auth/services/verification.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "email" and "code" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verificationService.verifyOTP(email, code, 'EMAIL_VERIFY');

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired email verification OTP code.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email address verified successfully.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to verify email address.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
