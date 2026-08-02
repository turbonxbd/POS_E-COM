import { calculateCartTotals } from '../../src/features/customer-website/services/cart.service';

describe('CartCalculatorService - Unit Tests', () => {
  const items = [
    { productId: 'p1', title: 'Wireless Headphones', price: 2500, quantity: 2 }, // 5000
    { productId: 'p2', title: 'Phone Case', price: 500, quantity: 1 }, // 500
  ];

  it('should calculate subtotal correctly (৳5,500 BDT)', () => {
    const res = calculateCartTotals(items, 0, 'INSIDE_DHAKA');
    expect(res.subtotal).toBe(5500);
  });

  it('should apply Inside Dhaka shipping fee of ৳70 BDT', () => {
    const res = calculateCartTotals(items, 0, 'INSIDE_DHAKA');
    expect(res.shippingFee).toBe(70);
    expect(res.grandTotal).toBe(5570);
  });

  it('should apply Outside Dhaka shipping fee of ৳130 BDT', () => {
    const res = calculateCartTotals(items, 0, 'OUTSIDE_DHAKA');
    expect(res.shippingFee).toBe(130);
    expect(res.grandTotal).toBe(5630);
  });

  it('should apply coupon discount amount accurately', () => {
    const res = calculateCartTotals(items, 500, 'INSIDE_DHAKA');
    expect(res.discountAmount).toBe(500);
    expect(res.grandTotal).toBe(5070); // 5500 - 500 + 70
  });
});
