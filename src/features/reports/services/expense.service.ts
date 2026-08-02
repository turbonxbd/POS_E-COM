import {
  DEFAULT_EXPENSE_CATEGORIES,
  ExpenseCategoryDTO,
  MerchantExpenseDTO,
} from '../../../types/reports.types';

/**
 * Enterprise Service for Merchant Operational Expense Tracking and Categories Management.
 */
export class ExpenseService {
  private static instance: ExpenseService | null = null;

  // In-memory stores: Map<merchantId, ExpenseCategoryDTO[] / MerchantExpenseDTO[]>
  private categoriesStore: Map<string, ExpenseCategoryDTO[]> = new Map();
  private expensesStore: Map<string, MerchantExpenseDTO[]> = new Map();

  private constructor() {
    this.seedDemoExpenses();
  }

  public static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService();
    }
    return ExpenseService.instance;
  }

  /**
   * Retrieves active expense categories for a merchant store.
   */
  public async getExpenseCategories(merchantId: string): Promise<ExpenseCategoryDTO[]> {
    let categories = this.categoriesStore.get(merchantId);
    if (!categories || categories.length === 0) {
      categories = DEFAULT_EXPENSE_CATEGORIES.map((catName, idx) => ({
        id: `cat-${idx + 1}`,
        merchantId,
        name: catName,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
      this.categoriesStore.set(merchantId, categories);
    }
    return categories;
  }

  /**
   * Adds a new merchant operational expense category.
   */
  public async addExpenseCategory(
    merchantId: string,
    name: string,
    description?: string
  ): Promise<ExpenseCategoryDTO> {
    const categories = await this.getExpenseCategories(merchantId);
    const newCategory: ExpenseCategoryDTO = {
      id: `cat-${Date.now()}`,
      merchantId,
      name: name.trim(),
      description: description || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    this.categoriesStore.set(merchantId, categories);
    return newCategory;
  }

  /**
   * Records a new merchant operational expense entry.
   */
  public async addExpense(
    merchantId: string,
    payload: Omit<MerchantExpenseDTO, 'id' | 'createdAt'>
  ): Promise<MerchantExpenseDTO> {
    if (!payload.title || !payload.amount || payload.amount <= 0) {
      throw new Error('Expense title and positive amount (BDT) are required.');
    }

    const categories = await this.getExpenseCategories(merchantId);
    const category = categories.find((c) => c.id === payload.categoryId);

    const newExpense: MerchantExpenseDTO = {
      ...payload,
      id: `exp-${Date.now()}`,
      merchantId,
      categoryName: category?.name || 'General Expense',
      amount: Math.round(payload.amount * 100) / 100,
      createdAt: new Date().toISOString(),
    };

    const expenses = this.expensesStore.get(merchantId) || [];
    expenses.unshift(newExpense);
    this.expensesStore.set(merchantId, expenses);

    return newExpense;
  }

  /**
   * Queries merchant operational expenses with optional date range & category filters.
   */
  public async getExpenses(
    merchantId: string,
    startDate?: string,
    endDate?: string,
    categoryId?: string
  ): Promise<MerchantExpenseDTO[]> {
    let list = this.expensesStore.get(merchantId) || [];

    if (categoryId) {
      list = list.filter((e) => e.categoryId === categoryId);
    }

    if (startDate) {
      const startMs = new Date(startDate).getTime();
      list = list.filter((e) => new Date(e.expenseDate).getTime() >= startMs);
    }

    if (endDate) {
      const endMs = new Date(endDate).getTime();
      list = list.filter((e) => new Date(e.expenseDate).getTime() <= endMs);
    }

    return list;
  }

  /**
   * Deletes an operational expense record.
   */
  public async deleteExpense(merchantId: string, expenseId: string): Promise<boolean> {
    const list = this.expensesStore.get(merchantId) || [];
    const filtered = list.filter((e) => e.id !== expenseId);
    if (filtered.length !== list.length) {
      this.expensesStore.set(merchantId, filtered);
      return true;
    }
    return false;
  }

  private seedDemoExpenses(): void {
    const demoId = 'merch-techstore';
    const categories: ExpenseCategoryDTO[] = [
      { id: 'cat-1', merchantId: demoId, name: 'Store Rent & Facilities', isActive: true, createdAt: new Date().toISOString() },
      { id: 'cat-2', merchantId: demoId, name: 'Utilities (Electricity, Water, Internet)', isActive: true, createdAt: new Date().toISOString() },
      { id: 'cat-3', merchantId: demoId, name: 'Staff Salaries & Payroll', isActive: true, createdAt: new Date().toISOString() },
      { id: 'cat-4', merchantId: demoId, name: 'Logistics & Courier Delivery', isActive: true, createdAt: new Date().toISOString() },
    ];
    this.categoriesStore.set(demoId, categories);

    const expenses: MerchantExpenseDTO[] = [
      {
        id: 'exp-101',
        merchantId: demoId,
        categoryId: 'cat-1',
        categoryName: 'Store Rent & Facilities',
        title: 'Monthly Outlet Rent (Banani Branch)',
        amount: 25000,
        expenseDate: new Date().toISOString(),
        paymentMethod: 'BANK',
        referenceNo: 'TXN-BANK-9910',
        note: 'July 2026 store rent paid',
        createdBy: 'Manager Rahim',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp-102',
        merchantId: demoId,
        categoryId: 'cat-2',
        categoryName: 'Utilities (Electricity, Water, Internet)',
        title: 'High Speed Fiber Internet Bill',
        amount: 3500,
        expenseDate: new Date().toISOString(),
        paymentMethod: 'MOBILE_BANKING',
        referenceNo: 'BKASH-881920',
        createdBy: 'Manager Rahim',
        createdAt: new Date().toISOString(),
      },
    ];
    this.expensesStore.set(demoId, expenses);
  }
}

export const expenseService = ExpenseService.getInstance();
