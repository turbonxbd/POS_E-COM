import { ProductDTO, CategoryDTO, BrandDTO } from '../../../types/inventory.types';
import { StorefrontProductFilter } from '../../../types/customer-website.types';
import { catalogService } from '../../inventory/services/catalog.service';

export interface StorefrontHomePageData {
  banners: { id: string; title: string; subtitle?: string; imageUrl: string; linkUrl?: string }[];
  categories: CategoryDTO[];
  featuredProducts: ProductDTO[];
  dealProducts: ProductDTO[];
  topBrands: BrandDTO[];
}

export interface PaginatedProductsResult {
  products: ProductDTO[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/**
 * Enterprise Service for Customer Storefront Catalog Querying, Homepage Sections, Filtering & Sorting.
 */
export class CatalogQueryService {
  private static instance: CatalogQueryService | null = null;

  private constructor() {}

  public static getInstance(): CatalogQueryService {
    if (!CatalogQueryService.instance) {
      CatalogQueryService.instance = new CatalogQueryService();
    }
    return CatalogQueryService.instance;
  }

  /**
   * Fetches homepage hero banners, categories, featured products, deals, and top brands for a storefront.
   */
  public async getStorefrontHomePageData(merchantId: string): Promise<StorefrontHomePageData> {
    const categories = await catalogService.getCategories(merchantId);
    const brands = await catalogService.getBrands(merchantId);
    const allProducts = await catalogService.getProducts(merchantId);

    const activeProducts = allProducts.filter((p) => p.isActive);
    const featuredProducts = activeProducts.slice(0, 8);
    const dealProducts = activeProducts.slice(0, 4);

    const banners = [
      {
        id: 'banner-1',
        title: 'New Generation Smartphones & Gadgets',
        subtitle: 'Get up to 20% cashback on bKash payments this week!',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80',
        linkUrl: '/smartphones',
      },
      {
        id: 'banner-2',
        title: 'Ultra Portable Laptops & Workstations',
        subtitle: 'Official warranty with free express delivery in Dhaka',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&auto=format&fit=crop&q=80',
        linkUrl: '/laptops',
      },
    ];

    return {
      banners,
      categories,
      featuredProducts,
      dealProducts,
      topBrands: brands,
    };
  }

  /**
   * Queries products with dynamic filters (Category, Brand, Price Range, Search, Stock) and sorting.
   */
  public async queryProducts(
    merchantId: string,
    filter: StorefrontProductFilter = {}
  ): Promise<PaginatedProductsResult> {
    const {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      searchQuery,
      sortBy = 'newest',
      inStockOnly = false,
      page = 1,
      limit = 12,
    } = filter;

    let products = await catalogService.getProducts(merchantId);
    products = products.filter((p) => p.isActive);

    // 1. Filter by Category
    if (categoryId) {
      products = products.filter((p) => p.categoryId === categoryId);
    }

    // 2. Filter by Brand
    if (brandId) {
      products = products.filter((p) => p.brandId === brandId);
    }

    // 3. Filter by Price Range
    if (minPrice !== undefined) {
      products = products.filter((p) => p.sellingPrice >= minPrice);
    }
    if (maxPrice !== undefined) {
      products = products.filter((p) => p.sellingPrice <= maxPrice);
    }

    // 4. Filter by Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.variants?.some((v) => v.variantName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
      );
    }

    // 5. Sorting
    products.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.sellingPrice - b.sellingPrice;
      }
      if (sortBy === 'price_desc') {
        return b.sellingPrice - a.sellingPrice;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

    // 6. Pagination
    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + limit);

    return {
      products: paginatedProducts,
      totalCount,
      page,
      totalPages,
    };
  }

  /**
   * Retrieves single product details by slug.
   */
  public async getProductBySlug(merchantId: string, slug: string): Promise<ProductDTO | null> {
    const products = await catalogService.getProducts(merchantId);
    const cleanSlug = slug.trim().toLowerCase();
    return products.find((p) => p.slug.toLowerCase() === cleanSlug && p.isActive) || null;
  }
}

export const catalogQueryService = CatalogQueryService.getInstance();
