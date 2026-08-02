import { checkoutService } from './checkout.service';

export class POSCheckoutEngineService {
  public async processCheckout(params: {
    merchantId?: string;
    registerId: string;
    staffId: string;
    sessionId?: string;
    items: Array<{ productId: string; variantId: string; name: string; unitPrice: number; quantity: number }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    paymentMethod: string;
    cashTendered?: number;
    splitPayments?: Array<{ method: string; amount: number; referenceNo?: string }>;
  }) {
    const merchantId = params.merchantId || 'merch-techstore';
    const registerId = params.registerId;
    const sessionId = params.sessionId || 'session-demo-01';
    const cashierId = params.staffId;

    let splits: Array<{ paymentMethod: any; amount: number; transactionReference?: string }> = [];

    if (params.paymentMethod === 'SPLIT' && params.splitPayments) {
      splits = params.splitPayments.map((sp) => ({
        paymentMethod: sp.method === 'MOBILE_BANKING' ? 'BKASH' : (sp.method as any),
        amount: sp.amount,
        transactionReference: sp.referenceNo,
      }));
    } else {
      splits = [
        {
          paymentMethod: (params.paymentMethod as any) || 'CASH',
          amount: params.grandTotal,
        },
      ];
    }

    const cartItems = (params.items || []).map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      productName: i.name,
      variantName: i.name,
      sku: i.variantId,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
    }));

    const result = await checkoutService.processPOSCheckout({
      merchantId,
      registerId,
      sessionId,
      cashierId,
      cartItems,
      subtotal: params.subtotal,
      discountAmount: params.discountAmount,
      taxAmount: params.taxAmount,
      grandTotal: params.grandTotal,
      paymentSplits: splits,
    });

    const cashTendered = params.cashTendered ?? params.grandTotal;
    const changeAmount = Math.max(0, cashTendered - params.grandTotal);

    return {
      success: result.success,
      orderNumber: result.order.orderNumber,
      changeAmount,
      order: result.order,
    };
  }
}

export const posCheckoutEngine = new POSCheckoutEngineService();
