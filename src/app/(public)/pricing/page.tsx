import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Pricing Plans & Billing Options',
  description: 'Flexible SaaS pricing plans for small retailers to large multi-tenant enterprises.',
});

export interface PlanPricingItem {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyEquivalent: number;
  trialDays: number;
  popular?: boolean;
  features: string[];
  limits: string[];
}

const PRICING_PLANS: PlanPricingItem[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small retailers launching their first online storefront.',
    monthlyPrice: 19,
    yearlyMonthlyEquivalent: 15,
    trialDays: 14,
    features: [
      'Up to 100 Products',
      '500 Orders per month',
      'Omnichannel POS Interface',
      'Bangladesh Courier Integrations',
      'Standard Email Support',
    ],
    limits: ['Max 2 Staff Accounts', 'Standard Subdomain'],
  },
  {
    id: 'pro',
    name: 'Professional Plan',
    badge: 'MOST POPULAR',
    popular: true,
    description: 'Growing brands needing custom domain, high volume, and analytics.',
    monthlyPrice: 49,
    yearlyMonthlyEquivalent: 39,
    trialDays: 14,
    features: [
      'Up to 1,000 Products',
      '5,000 Orders per month',
      'Custom Domain Support (store.com)',
      'Advanced Sales & Profit Analytics',
      'Priority Email & Chat Support',
      'API & Webhooks Access',
    ],
    limits: ['Max 5 Staff Accounts', 'Custom Domain Allowed'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    badge: 'UNLIMITED SCALE',
    description: 'High-volume merchants requiring custom limits and 24/7 dedicated support.',
    monthlyPrice: 199,
    yearlyMonthlyEquivalent: 159,
    trialDays: 30,
    features: [
      'Unlimited Products & Orders',
      'Custom Domain Support',
      'Multi-Branch Inventory Sync',
      'Dedicated Account Manager',
      '24/7 Phone & Priority Support',
      'Custom SLA & Backup Guarantee',
    ],
    limits: ['Up to 50 Staff Accounts', 'Dedicated DB Node'],
  },
];

const PRICING_FAQS = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes, you can upgrade or downgrade your plan anytime from your platform tenant settings.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All plans come with a 14-day free trial. No credit card is required to sign up.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Credit/Debit Cards (Visa, Mastercard, Amex), bKash, Nagad, and Bank Transfers.',
  },
  {
    q: 'What happens when I reach my plan limit?',
    a: 'You will receive an automated notification. You can easily upgrade to the next tier without any service interruption.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="ag-pricing-page" style={{ paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-success" style={{ marginBottom: '0.75rem' }}>
            TRANSPARENT PRICING
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            Simple Plans for Businesses of All Sizes
          </h1>
          <p className="ag-hero-subtitle">
            Choose the right subscription for your store. Save up to 20% with yearly billing.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="ag-pricing-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ fontWeight: billingCycle === 'monthly' ? 600 : 400 }}>Monthly Billing</span>
            <button
              type="button"
              className="ag-btn ag-btn-outline ag-btn-sm"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              style={{ borderRadius: '9999px', padding: '0.25rem 0.75rem' }}
            >
              {billingCycle === 'yearly' ? '✓ Yearly (20% OFF)' : 'Switch to Yearly'}
            </button>
            <span style={{ fontWeight: billingCycle === 'yearly' ? 600 : 400 }}>
              Yearly Billing <span className="ag-badge ag-badge-success">SAVE 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="ag-page-container">
        <div className="ag-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {PRICING_PLANS.map((plan) => {
            const displayPrice = billingCycle === 'yearly' ? plan.yearlyMonthlyEquivalent : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`ag-pricing-card ${plan.popular ? 'ag-pricing-card-popular' : ''}`}
                style={{
                  position: 'relative',
                  border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-0.875rem', right: '1.5rem' }}>
                    <span className="ag-badge ag-badge-info">{plan.badge}</span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle style={{ fontSize: '1.5rem' }}>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  <div style={{ margin: '1.5rem 0 0.5rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 800 }}>${displayPrice}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}> / month</span>
                    {billingCycle === 'yearly' && (
                      <div style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
                        Billed annually (${displayPrice * 12}/yr)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>
                    What's included:
                  </div>
                  <ul className="ag-footer-links" style={{ gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ color: 'var(--foreground)', fontSize: '0.9375rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>
                    Limits:
                  </div>
                  <ul className="ag-footer-links" style={{ gap: '0.375rem' }}>
                    {plan.limits.map((lim, lIdx) => (
                      <li key={lIdx} style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                        • {lim}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter style={{ backgroundColor: 'transparent', borderTop: 'none', paddingTop: 0 }}>
                  <a href={`/register?plan=${plan.id}&billing=${billingCycle}`} style={{ width: '100%' }}>
                    <Button variant={plan.popular ? 'primary' : 'outline'} size="lg" style={{ width: '100%' }}>
                      Start {plan.trialDays}-Day Free Trial
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Pricing FAQs Accordion Section */}
        <div style={{ marginTop: '4rem', maxWidth: '48rem', margin: '4rem auto 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="ag-page-title">Frequently Asked Questions</h2>
            <p className="ag-page-description">Everything you need to know about billing and plans.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {PRICING_FAQS.map((faq, fIdx) => (
              <Card key={fIdx}>
                <CardHeader style={{ padding: '1.25rem 1.5rem' }}>
                  <CardTitle style={{ fontSize: '1.125rem' }}>{faq.q}</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '0 1.5rem 1.25rem' }}>
                  <CardDescription style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{faq.a}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
