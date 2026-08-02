import { verificationService } from '../../../../../features/merchant-auth/services/verification.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "phone" and "code" are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verificationService.verifyOTP(phone, code, 'PHONE_VERIFY');

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired phone verification OTP code.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Phone number verified successfully.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to verify phone number.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
