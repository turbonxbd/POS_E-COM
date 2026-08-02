import { CRMCustomerSummary } from '../../../types/customer-crm.types';

/**
 * Utility for Exporting Customer CRM Profiles and Marketing Lists to CSV Format.
 */
export class CRMExporter {
  /**
   * Converts customer CRM summary array into RFC-4180 compliant CSV string for SMS/Email marketing platforms.
   */
  public static exportCustomersToCSV(customers: CRMCustomerSummary[]): string {
    const headers = [
      'Customer ID',
      'Full Name',
      'Phone Number',
      'Email Address',
      'Membership Tier',
      'Lifetime Value (BDT)',
      'Total Orders',
      'Average Order Value (BDT)',
      'Reward Points',
      'Tags',
      'Last Order Date',
    ];

    const rows = customers.map((c) => {
      const p = c.profile;
      return [
        c.id,
        this.escapeCSV(c.name),
        this.escapeCSV(c.phone),
        this.escapeCSV(c.email || ''),
        p.membershipTier,
        p.lifetimeValue.toFixed(2),
        p.totalOrdersCount,
        p.averageOrderValue.toFixed(2),
        p.rewardPoints,
        this.escapeCSV((p.tags || []).join('; ')),
        p.lastOrderAt ? new Date(p.lastOrderAt).toISOString().split('T')[0] : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    return csvContent;
  }

  private static escapeCSV(value: string | number): string {
    const stringVal = String(value);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  }
}
