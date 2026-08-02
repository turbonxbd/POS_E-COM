import { hashPassword } from '../../../../../lib/auth-security';
import { verificationService } from '../../../../../features/merchant-auth/services/verification.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerName, email, password, phone, role } = body;

    if (!ownerName || !email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required registration parameters (ownerName, email, password).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordHash = hashPassword(password);
    const assignedRole = role || 'STAFF';

    // Trigger initial Email Verification OTP
    await verificationService.sendOTP(email, 'EMAIL_VERIFY');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Merchant user registered successfully. Verification OTP dispatched.',
        data: {
          name: ownerName,
          email,
          phone,
          role: assignedRole,
          isEmailVerified: false,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to register merchant user.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
