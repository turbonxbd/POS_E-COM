import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Platform Features & Capabilities',
  description: 'In-depth overview of Antigravity eCommerce POS, Inventory Sync, Courier Integrations, and Multi-Tenancy.',
});

interface DetailedFeature {
  id: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  icon: string;
}

const FEATURE_BREAKDOWNS: DetailedFeature[] = [
  {
    id: 'pos',
    badge: 'RETAIL POS',
    title: 'Omnichannel POS System',
    description:
      'Connect physical retail barcode scanners, receipt printers, and cash drawers directly to your cloud multi-tenant database. Eliminate double-entry and manual stock counts forever.',
    highlights: [
      'Offline sale mode with automatic cloud sync upon reconnection',
      'Multi-cashier staff permission controls & register closure reports',
      'Barcode label generation & thermal receipt printing',
      'Customer loyalty points & store credit management',
    ],
    icon: '🛒',
  },
  {
    id: 'inventory',
    badge: 'STOCK ENGINE',
    title: 'Real-Time Inventory & Multi-Branch Engine',
    description:
      'Manage multiple warehouses, physical shops, and online stock allocations from one central dashboard with real-time low-stock alerts.',
    highlights: [
      'Automated stock deduction across all channels in real time',
      'Inter-branch stock transfer orders & approval workflows',
      'SKU variant tracking (Color, Size, Material, Serial Numbers)',
      'Low stock threshold notifications via SMS & Email',
    ],
    icon: '📦',
  },
  {
    id: 'storefront',
    badge: 'NO-CODE BUILDER',
    title: 'Customizable E-Commerce Storefront',
    description:
      'Give every tenant a unique brand presence with customizable dynamic CSS theme variables, custom domain integration, and ultra-fast page load times.',
    highlights: [
      'Custom Domain Support (e.g. store.merchant.com)',
      'Drag-and-drop banner, collection, and product layout sections',
      'Mobile-first responsive design optimized for high conversion',
      'Multi-currency and multi-language (English / Bengali) support',
    ],
    icon: '🎨',
  },
  {
    id: 'couriers',
    badge: 'BANGLADESH LOGISTICS',
    title: 'Automated Courier & Shipping Integrations',
    description:
      'Seamlessly book delivery parcels, generate shipping labels, and track COD (Cash On Delivery) payouts directly with Bangladesh courier partners.',
    highlights: [
      'Steadfast Courier API auto-booking & tracking',
      'Pathao Courier API automated order dispatch',
      'RedX & Paperfly logistics status updates',
      'Automated Cash on Delivery (COD) payment reconciliation',
    ],
    icon: '🚚',
  },
  {
    id: 'analytics',
    badge: 'REPORTS & INSIGHTS',
    title: 'Advanced Reports & SaaS Analytics',
    description:
      'Gain full visibility into sales trends, top-performing product categories, cashier shift logs, and net profit margins across all sales channels.',
    highlights: [
      'Daily, weekly, and monthly sales performance breakdown',
      'Product margin, COGS (Cost of Goods Sold), and profit tracking',
      'Exportable CSV and Excel financial audit reports',
      'Customer lifetime value (LTV) and churn analytics',
    ],
    icon: '📊',
  },
];

const MATRIX_ROWS = [
  { name: 'Multi-Tenant Subdomains', starter: true, pro: true, enterprise: true },
  { name: 'Custom Domain Mapping', starter: false, pro: true, enterprise: true },
  { name: 'Omnichannel POS System', starter: true, pro: true, enterprise: true },
  { name: 'Bangladesh Courier Auto-Booking', starter: true, pro: true, enterprise: true },
  { name: 'Max Monthly Orders', starter: '500', pro: '5,000', enterprise: 'Unlimited' },
  { name: 'Max Staff Accounts', starter: '2', pro: '5', enterprise: '50' },
  { name: 'API Access & Webhooks', starter: false, pro: true, enterprise: true },
  { name: 'Dedicated Account Manager', starter: false, pro: false, enterprise: true },
];

export default function FeaturesPage() {
  return (
    <div className="ag-features-page" style={{ paddingBottom: '4rem' }}>
      {/* Page Header */}
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2.5rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            COMPLETE FEATURE GUIDE
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            Built for Modern Retail & SaaS High-Growth Brands
          </h1>
          <p className="ag-hero-subtitle">
            Explore the powerful tools behind Antigravity eCommerce — from omnichannel POS to automated Bangladesh logistics.
          </p>
        </div>
      </section>

      {/* Feature Breakdowns */}
      <section className="ag-page-container" style={{ gap: '3rem' }}>
        {FEATURE_BREAKDOWNS.map((item, idx) => (
          <Card key={item.id} className="ag-feature-breakdown-card">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="ag-badge ag-badge-info">{item.badge}</span>
                <span style={{ fontSize: '2rem' }}>{item.icon}</span>
              </div>
              <CardTitle style={{ fontSize: '1.5rem' }}>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription style={{ fontSize: '1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {item.description}
              </CardDescription>

              <div className="ag-feature-highlights-grid">
                {item.highlights.map((hl, hIdx) => (
                  <div key={hIdx} className="ag-feature-highlight-item">
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Feature Comparison Matrix Table */}
        <div className="ag-feature-matrix-section" style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="ag-page-title">Feature Comparison Matrix</h2>
            <p className="ag-page-description">Compare feature availability across plans.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ag-feature-matrix-table">
              <thead>
                <tr>
                  <th>Feature Capability</th>
                  <th>Starter</th>
                  <th>Professional</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td>{typeof row.starter === 'boolean' ? (row.starter ? '✓' : '—') : row.starter}</td>
                    <td>{typeof row.pro === 'boolean' ? (row.pro ? '✓' : '—') : row.pro}</td>
                    <td>{typeof row.enterprise === 'boolean' ? (row.enterprise ? '✓' : '—') : row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <Card className="ag-page-cta-banner" style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: 'var(--accent)', marginTop: '2rem' }}>
          <CardTitle style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Ready to Scale Your Business?</CardTitle>
          <CardDescription style={{ fontSize: '1.0625rem', marginBottom: '1.5rem', maxWidth: '36rem', margin: '0 auto 1.5rem' }}>
            Start your 14-day free trial today. No credit card required.
          </CardDescription>
          <a href="/register">
            <Button variant="primary" size="lg">
              Start Free Trial Now
            </Button>
          </a>
        </Card>
      </section>
    </div>
  );
}
