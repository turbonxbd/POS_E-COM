import { validateMerchantApiAccess } from '../../../../lib/merchant-api-guard';
import { expenseService } from '../../../../features/reports/services/expense.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const expenses = await expenseService.getExpenses(
      auth.merchantId,
      startDate,
      endDate,
      categoryId
    );
    const categories = await expenseService.getExpenseCategories(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: { expenses, categories } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch merchant expenses.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const body = await request.json();
    const { categoryId, title, amount, expenseDate, paymentMethod, referenceNo, note } = body;

    if (!categoryId || !title || !amount || Number(amount) <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameters "categoryId", "title", and positive "amount" (BDT) are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const createdBy = auth.user?.name || auth.user?.id || 'Staff Admin';
    const newExpense = await expenseService.addExpense(auth.merchantId, {
      merchantId: auth.merchantId,
      categoryId,
      title: title.trim(),
      amount: Number(amount),
      expenseDate: expenseDate || new Date().toISOString(),
      paymentMethod: paymentMethod || 'CASH',
      referenceNo: referenceNo || null,
      note: note || null,
      createdBy,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Merchant operational expense recorded successfully.',
        data: newExpense,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to record operational expense.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
