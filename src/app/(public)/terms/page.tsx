import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Terms of Service',
  description: 'Terms of Service governing the use of the Antigravity multi-tenant SaaS platform.',
});

export default function TermsPage() {
  return (
    <div className="ag-legal-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-outline" style={{ marginBottom: '0.75rem' }}>
            LEGAL AGREEMENT
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.5rem' }}>Terms of Service</h1>
          <p className="ag-hero-subtitle">Last Updated: January 1, 2026</p>
        </div>
      </section>

      <section className="ag-page-container" style={{ maxWidth: '50rem' }}>
        <Card style={{ padding: '2rem' }}>
          <CardContent style={{ lineHeight: 1.8, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 0 }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Antigravity multi-tenant platform, websites, services, or software, you agree to be bound by these Terms of Service.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>2. Provisioning & Tenant Account Safety</h2>
            <p>
              You are responsible for maintaining the confidentiality of your tenant account credentials and for all activities occurring under your tenant subdomains.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>3. Subscription Billing & Renewals</h2>
            <p>
              Subscriptions auto-renew monthly or annually based on your selected billing cycle unless cancelled prior to the renewal date.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>4. Termination</h2>
            <p>
              We reserve the right to suspend or terminate tenant accounts that violate system usage limits, security rules, or applicable laws.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
