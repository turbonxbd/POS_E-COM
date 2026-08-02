export async function GET() {
  try {
    const mockSubscriptionData = {
      planName: 'Professional Plan',
      status: 'ACTIVE',
      billingCycle: 'YEARLY',
      renewalDate: new Date(Date.now() + 240 * 86400000).toISOString(),
      monthlyPrice: 39,
      metrics: [
        { label: 'Products Stocked', used: 420, max: 1000 },
        { label: 'Monthly Orders', used: 1240, max: 5000 },
        { label: 'Staff Accounts', used: 3, max: 5 },
        { label: 'Custom Domain Mapping', used: 1, max: 1, unit: 'domain' },
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: mockSubscriptionData,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch merchant subscription overview.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
