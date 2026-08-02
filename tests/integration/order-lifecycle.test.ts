import { orderLifecycleService } from '../../src/features/order-management/services/order-lifecycle.service';

describe('Order Lifecycle Integration Tests', () => {
  const orderId = 'ORD-TEST-9901';
  const userId = 'user-staff-01';

  it('should transition order status from PENDING to PROCESSING', async () => {
    const res = await orderLifecycleService.updateOrderStatus(orderId, 'PROCESSING', userId, 'Order verified');
    expect(res.success).toBe(true);
    expect(res.currentStatus).toBe('PROCESSING');
  });

  it('should transition order status from PROCESSING to PACKED', async () => {
    const res = await orderLifecycleService.updateOrderStatus(orderId, 'PACKED', userId, 'Packed in warehouse');
    expect(res.success).toBe(true);
    expect(res.currentStatus).toBe('PACKED');
  });

  it('should trigger inventory restocking on status CANCELLED', async () => {
    const res = await orderLifecycleService.updateOrderStatus(orderId, 'CANCELLED', userId, 'Customer cancelled order');
    expect(res.success).toBe(true);
    expect(res.currentStatus).toBe('CANCELLED');
    expect(res.restocked).toBe(true);
  });
});
