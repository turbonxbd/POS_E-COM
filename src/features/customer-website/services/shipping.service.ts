export interface ShippingCalculationResult {
  shippingFee: number;
  ruleApplied: string;
  isFreeShipping: boolean;
  freeShippingThresholdRemaining: number;
}

export interface DivisionDistricts {
  division: string;
  districts: string[];
}

/**
 * Enterprise Service for Bangladesh Location-Based Shipping Calculations & Address Options.
 */
export class ShippingService {
  private static instance: ShippingService | null = null;
  private readonly FREE_SHIPPING_THRESHOLD = 3000;
  private readonly INSIDE_DHAKA_FEE = 70;
  private readonly OUTSIDE_DHAKA_FEE = 130;

  private constructor() {}

  public static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService();
    }
    return ShippingService.instance;
  }

  /**
   * Calculates delivery charge based on Bangladesh location rules and cart subtotal.
   */
  public calculateShippingFee(
    division: string = 'Dhaka',
    district: string = 'Dhaka',
    subtotal: number = 0
  ): ShippingCalculationResult {
    // 1. Check Free Shipping Threshold Trigger
    if (subtotal >= this.FREE_SHIPPING_THRESHOLD) {
      return {
        shippingFee: 0,
        ruleApplied: `Free Delivery Applied (Order subtotal >= ৳${this.FREE_SHIPPING_THRESHOLD})`,
        isFreeShipping: true,
        freeShippingThresholdRemaining: 0,
      };
    }

    const cleanDistrict = district.trim().toLowerCase();

    // 2. Check Inside Dhaka vs Outside Dhaka
    const isInsideDhaka =
      cleanDistrict === 'dhaka' || cleanDistrict === 'dhaka city' || cleanDistrict === 'dhaka north' || cleanDistrict === 'dhaka south';

    const shippingFee = isInsideDhaka ? this.INSIDE_DHAKA_FEE : this.OUTSIDE_DHAKA_FEE;
    const remainingForFree = Math.max(0, this.FREE_SHIPPING_THRESHOLD - subtotal);

    return {
      shippingFee,
      ruleApplied: isInsideDhaka
        ? 'Inside Dhaka Express Delivery (৳70)'
        : 'Outside Dhaka Courier Delivery (৳130)',
      isFreeShipping: false,
      freeShippingThresholdRemaining: remainingForFree,
    };
  }

  /**
   * Returns list of 8 Administrative Divisions and Districts of Bangladesh for checkout selectors.
   */
  public getBangladeshDivisionsAndDistricts(): DivisionDistricts[] {
    return [
      {
        division: 'Dhaka',
        districts: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Gopalganj', 'Madaripur', 'Kishoreganj'],
      },
      {
        division: 'Chattogram',
        districts: ['Chattogram', 'Cox\'s Bazar', 'Cumilla', 'Feni', 'Noakhali', 'Brahmanbaria', 'Chandpur', 'Lakshmipur', 'Khagrachhari', 'Rangamati', 'Bandarban'],
      },
      {
        division: 'Rajshahi',
        districts: ['Rajshahi', 'Bogra', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Japainawabganj', 'Joypurhat'],
      },
      {
        division: 'Khulna',
        districts: ['Khulna', 'Jashore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah', 'Magura', 'Meherpur', 'Narail', 'Chuadanga'],
      },
      {
        division: 'Sylhet',
        districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
      },
      {
        division: 'Barishal',
        districts: ['Barishal', 'Bhola', 'Patukhali', 'Pirojpur', 'Barguna', 'Jhalokathi'],
      },
      {
        division: 'Rangpur',
        districts: ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
      },
      {
        division: 'Mymensingh',
        districts: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
      },
    ];
  }
}

export const shippingService = ShippingService.getInstance();
