import { onboardingService } from '../../../../features/subscription/services/onboarding.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Query parameter "subdomain" is required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const available = await onboardingService.isSubdomainAvailable(subdomain);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subdomain,
          available,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to check subdomain availability.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
