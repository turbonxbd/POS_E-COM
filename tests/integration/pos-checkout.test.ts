import { posCheckoutEngine } from '../../src/features/pos/services/pos-checkout.service';

describe('POS Checkout Engine Integration Tests', () => {
  const registerId = 'reg-banani-01';
  const staffId = 'staff-01';

  it('should process POS cash transaction and return completed order receipt', async () => {
    const res = await posCheckoutEngine.processCheckout({
      registerId,
      staffId,
      items: [
        { productId: 'p1', variantId: 'v1', name: 'Power Bank', unitPrice: 1500, quantity: 1 },
      ],
      subtotal: 1500,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 1500,
      paymentMethod: 'CASH',
      cashTendered: 2000,
    });

    expect(res.success).toBe(true);
    expect(res.orderNumber).toBeDefined();
    expect(res.changeAmount).toBe(500);
  });

  it('should process POS split payment (Cash + bKash)', async () => {
    const res = await posCheckoutEngine.processCheckout({
      registerId,
      staffId,
      items: [
        { productId: 'p2', variantId: 'v2', name: 'Smart Watch', unitPrice: 4000, quantity: 1 },
      ],
      subtotal: 4000,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 4000,
      paymentMethod: 'SPLIT',
      splitPayments: [
        { method: 'CASH', amount: 2000 },
        { method: 'MOBILE_BANKING', amount: 2000, referenceNo: 'BKASH-998811' },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.orderNumber).toBeDefined();
  });
});
