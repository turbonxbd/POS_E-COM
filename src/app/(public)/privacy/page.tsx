import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Privacy Policy',
  description: 'Privacy Policy explaining how Antigravity collects, protects, and uses merchant data.',
});

export default function PrivacyPage() {
  return (
    <div className="ag-legal-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-outline" style={{ marginBottom: '0.75rem' }}>
            DATA PROTECTION
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.5rem' }}>Privacy Policy</h1>
          <p className="ag-hero-subtitle">Last Updated: January 1, 2026</p>
        </div>
      </section>

      <section className="ag-page-container" style={{ maxWidth: '50rem' }}>
        <Card style={{ padding: '2rem' }}>
          <CardContent style={{ lineHeight: 1.8, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 0 }}>1. Data Collection & Multi-Tenant Separation</h2>
            <p>
              Antigravity collects merchant owner details, store metadata, and order analytics exclusively to provide our multi-tenant SaaS services. All merchant data is logically and cryptographically isolated.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>2. Use of Information</h2>
            <p>
              We do not sell, rent, or share merchant or customer data with third parties except as necessary to perform essential integration services (e.g. Bangladesh courier dispatches and payment gateway processing).
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>3. Data Security & Encryption</h2>
            <p>
              We utilize TLS/SSL encryption for data in transit and AES-256 encryption for data at rest. Regular automated security audits guarantee tenant compliance.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
