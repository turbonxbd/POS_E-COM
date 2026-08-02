import { searchService } from '../../../../features/customer-website/services/search.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merch-techstore';
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 8;

    const result = await searchService.autoCompleteSearch(merchantId, query, limit);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to perform live product autocomplete search.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
