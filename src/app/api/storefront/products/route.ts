import { catalogQueryService } from '../../../../features/customer-website/services/catalog-query.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merch-techstore';
    const slug = searchParams.get('slug');

    // Single Product Query by Slug
    if (slug) {
      const product = await catalogQueryService.getProductBySlug(merchantId, slug);
      if (!product) {
        return new Response(
          JSON.stringify({ success: false, error: `Product with slug "${slug}" not found.` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: product }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Paginated Catalog List Query with Filters
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const searchQuery = searchParams.get('searchQuery') || searchParams.get('q') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'newest';
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 12;

    const result = await catalogQueryService.queryProducts(merchantId, {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      searchQuery,
      sortBy,
      inStockOnly,
      page,
      limit,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to query storefront products.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
