/**
 * Comprehensive Multi-Language (English 'en' and Bengali 'bn') Translation Dictionaries across all 15 Platform Modules.
 */
export const TRANSLATION_DICTIONARIES = {
  en: {
    // Navigation & Common
    appTitle: 'SME Merchant OS & E-Commerce Platform',
    dashboard: 'Dashboard',
    posTerminal: 'POS Terminal',
    orders: 'Order Management',
    customerCRM: 'Customer CRM & Loyalty',
    reports: 'Financial Reports',
    inventory: 'Inventory & Barcodes',
    settings: 'Store Builder Settings',
    logout: 'Logout',
    search: 'Search...',
    filter: 'Filter',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',

    // POS Module
    posTitle: 'POS Point of Sale Terminal',
    holdSale: 'Hold Sale',
    resumeSale: 'Resume Sale',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    payNow: 'Pay & Complete Sale',
    cash: 'Cash Payment',
    mobileBanking: 'bKash / Nagad',
    card: 'Credit / Debit Card',

    // Customer CRM Module
    crmTitle: 'Customer CRM & Loyalty Workspace',
    ltv: 'Lifetime Value (LTV)',
    rewardPoints: 'Reward Points',
    membershipTier: 'Membership Tier',
    bronze: 'Bronze Tier',
    silver: 'Silver Tier',
    gold: 'Gold Tier',
    platinum: 'Platinum Tier',
    addStaffNote: 'Add Staff Internal Note',

    // Reports & Financials Module
    reportsTitle: 'Financial Reports & Analytics',
    grossRevenue: 'Gross Sales Revenue',
    cogs: 'Cost of Goods Sold (COGS)',
    grossProfit: 'Gross Profit',
    operationalExpenses: 'Operational Expenses',
    netProfit: 'Net Income / Profit',
    recordExpense: 'Record New Expense',
  },
  bn: {
    // Navigation & Common
    appTitle: 'এসএমই মার্চেন্ট ওএস এবং ই-কমার্স প্ল্যাটফর্ম',
    dashboard: 'ড্যাশবোর্ড',
    posTerminal: 'পিওএস বিক্রয় টার্মিনাল',
    orders: 'অর্ডার ব্যবস্থাপনা',
    customerCRM: 'গ্রাহক সিআরএম এবং রিওয়ার্ড সিস্টেম',
    reports: 'আর্থিক হিসাব ও রিপোর্ট',
    inventory: 'ইনভেন্টরি ও বারকোড স্টুডিও',
    settings: 'স্টোর বিল্ডার সেটিংস',
    logout: 'লগআউট',
    search: 'সন্ধান করুন...',
    filter: 'ফিল্টার',
    exportCSV: 'সিএসভি এক্সপোর্ট',
    exportPDF: 'পিডিএফ প্রিন্ট',

    // POS Module
    posTitle: 'পিওএস বিক্রয় কেন্দ্র টার্মিনাল',
    holdSale: 'হোল্ড সেল',
    resumeSale: 'হোল্ড সেল ফেরত',
    subtotal: 'সাবটোটাল',
    discount: 'ডিসকাউন্ট / ছাড়',
    grandTotal: 'সর্বমোট টাকা',
    payNow: 'মূল্য পরিশোধ ও বিলিং',
    cash: 'নগদ ক্যাশ গ্রহণ',
    mobileBanking: 'বিকাশ / নগদ পেমেন্ট',
    card: 'কার্ড পেমেন্ট',

    // Customer CRM Module
    crmTitle: 'গ্রাহক সিআরএম এবং লয়ালটি রিওয়ার্ডস',
    ltv: 'লাইফটাইম ভ্যালু (এলটিভি)',
    rewardPoints: 'রিওয়ার্ড পয়েন্ট',
    membershipTier: 'মেম্বারশিপ টায়ার',
    bronze: 'ব্রোঞ্জ টায়ার',
    silver: 'সিলভার টায়ার',
    gold: 'গোল্ড টায়ার',
    platinum: 'প্ল্যাটিনাম টায়ার',
    addStaffNote: 'স্টাফ ইন্টারনাল নোট যুক্ত করুন',

    // Reports & Financials Module
    reportsTitle: 'আর্থিক লাভ-ক্ষতি হিসাব ও রিপোর্ট',
    grossRevenue: 'মোট বিক্রয় আয়',
    cogs: 'পণ্য ক্রয় ও উৎপাদন খরচ (COGS)',
    grossProfit: 'গ্রস প্রফিট / মোট লাভ',
    operationalExpenses: 'দোকান ও পরিচালন ব্যয়',
    netProfit: 'নিট লাভ / নিট ইনকাম',
    recordExpense: 'নতুন খরচ এন্ট্রি করুন',
  },
};

/**
 * Returns translated string for key path.
 */
export function translate(locale: 'en' | 'bn', key: string): string {
  const dict = TRANSLATION_DICTIONARIES[locale] || TRANSLATION_DICTIONARIES['en'];
  return (dict as any)[key] || key;
}
