import { CustomerWishlistDTO } from '../../../types/customer-website.types';

export interface ToggleWishlistResult {
  isWishlisted: boolean;
  item?: CustomerWishlistDTO;
  message: string;
}

/**
 * Enterprise Service for Customer Storefront Wishlist Management & Guest Account Merging.
 */
export class WishlistService {
  private static instance: WishlistService | null = null;
  // In-memory wishlist store: Map<customerId, CustomerWishlistDTO[]>
  private wishlistStore: Map<string, CustomerWishlistDTO[]> = new Map();

  private constructor() {
    this.seedDemoWishlists();
  }

  public static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  /**
   * Retrieves all saved wishlist items for a customer account.
   */
  public async getCustomerWishlist(customerId: string): Promise<CustomerWishlistDTO[]> {
    return this.wishlistStore.get(customerId) || [];
  }

  /**
   * Toggles a product variant in the customer wishlist (Add if absent, Remove if present).
   */
  public async toggleWishlist(customerId: string, variantId: string): Promise<ToggleWishlistResult> {
    const list = this.wishlistStore.get(customerId) || [];
    const index = list.findIndex((item) => item.variantId === variantId);

    if (index > -1) {
      // Remove from wishlist
      list.splice(index, 1);
      this.wishlistStore.set(customerId, list);
      return {
        isWishlisted: false,
        message: 'Product removed from your wishlist.',
      };
    } else {
      // Add to wishlist
      const newItem: CustomerWishlistDTO = {
        id: `wish-${Date.now()}`,
        customerId,
        variantId,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newItem);
      this.wishlistStore.set(customerId, list);
      return {
        isWishlisted: true,
        item: newItem,
        message: 'Product added to your wishlist.',
      };
    }
  }

  /**
   * Merges guest browser wishlist variant IDs into customer account wishlist upon login.
   */
  public async syncGuestWishlist(
    customerId: string,
    guestVariantIds: string[]
  ): Promise<CustomerWishlistDTO[]> {
    const list = this.wishlistStore.get(customerId) || [];
    const existingVariantIds = new Set(list.map((i) => i.variantId));

    for (const vId of guestVariantIds) {
      if (!existingVariantIds.has(vId)) {
        const newItem: CustomerWishlistDTO = {
          id: `wish-sync-${Date.now()}-${vId.slice(-4)}`,
          customerId,
          variantId: vId,
          createdAt: new Date().toISOString(),
        };
        list.unshift(newItem);
        existingVariantIds.add(vId);
      }
    }

    this.wishlistStore.set(customerId, list);
    return list;
  }

  /**
   * Removes a single product variant from wishlist.
   */
  public async removeFromWishlist(customerId: string, variantId: string): Promise<boolean> {
    const list = this.wishlistStore.get(customerId) || [];
    const filtered = list.filter((item) => item.variantId !== variantId);
    if (filtered.length !== list.length) {
      this.wishlistStore.set(customerId, filtered);
      return true;
    }
    return false;
  }

  private seedDemoWishlists(): void {
    const demoCustId = 'cust-101';
    this.wishlistStore.set(demoCustId, [
      {
        id: 'wish-demo-1',
        customerId: demoCustId,
        variantId: 'var-101',
        productName: 'iPhone 15 Pro Silicone Case',
        variantName: 'Black / M',
        unitPrice: 1500,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export const wishlistService = WishlistService.getInstance();
