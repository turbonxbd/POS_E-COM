import { onboardingService, MerchantRegistrationDTO } from '../../../../features/subscription/services/onboarding.service';

export async function POST(request: Request) {
  try {
    const body: MerchantRegistrationDTO = await request.json();

    if (!body.ownerName || !body.email || !body.businessName || !body.subdomain || !body.planId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required onboarding parameters (ownerName, email, businessName, subdomain, planId).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const registrationResult = await onboardingService.registerMerchantWithPlan(body);

    return new Response(
      JSON.stringify({
        success: true,
        data: registrationResult,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to complete merchant onboarding registration.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
