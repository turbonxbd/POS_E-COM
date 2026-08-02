import { catalogService } from '../../inventory/services/catalog.service';

export interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  sku: string;
  imageUrl?: string | null;
  categoryName?: string;
}

export interface AutoCompleteResult {
  query: string;
  suggestions: SearchResultItem[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  totalMatches: number;
}

/**
 * Enterprise Service for Storefront Live Autocomplete & Fuzzy Product Search.
 */
export class SearchService {
  private static instance: SearchService | null = null;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Fast live search autocomplete returning products, categories, and matching brands.
   */
  public async autoCompleteSearch(
    merchantId: string,
    query: string,
    limit: number = 8
  ): Promise<AutoCompleteResult> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { query: '', suggestions: [], categories: [], brands: [], totalMatches: 0 };
    }

    const allProducts = await catalogService.getProducts(merchantId);
    const allCategories = await catalogService.getCategories(merchantId);
    const allBrands = await catalogService.getBrands(merchantId);

    // Matching products
    const matchedProducts = allProducts.filter((p) => {
      if (!p.isActive) return false;
      const matchTitle = p.name.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchVariant = p.variants?.some(
        (v) => v.variantName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q)
      );
      return matchTitle || matchSlug || matchDesc || matchVariant;
    });

    const suggestions: SearchResultItem[] = [];
    matchedProducts.forEach((p) => {
      const cat = allCategories.find((c) => c.id === p.categoryId);
      const defaultVariant = p.variants?.[0];
      suggestions.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.sellingPrice,
        sku: defaultVariant?.sku || 'SKU-GEN',
        categoryName: cat?.name,
      });
    });

    // Matching Categories & Brands
    const matchedCategories = allCategories
      .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    const matchedBrands = allBrands
      .filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
      .map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

    return {
      query: q,
      suggestions: suggestions.slice(0, limit),
      categories: matchedCategories.slice(0, 4),
      brands: matchedBrands.slice(0, 4),
      totalMatches: suggestions.length,
    };
  }
}

export const searchService = SearchService.getInstance();
