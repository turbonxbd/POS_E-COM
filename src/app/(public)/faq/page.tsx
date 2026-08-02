import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Search answers about multi-tenant setup, POS, pricing, Bangladesh couriers, and security.',
});

interface FAQItem {
  id: string;
  category: 'General' | 'Pricing' | 'POS' | 'Online Store' | 'Payments & Logistics';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'What is a multi-tenant platform architecture?',
    answer:
      'Multi-tenancy is an architecture where a single instance of the software application serves multiple distinct merchant accounts (tenants). Each tenant has complete data isolation, customized branding, and custom domain options.',
  },
  {
    id: 'faq-2',
    category: 'General',
    question: 'How fast can I launch my merchant store?',
    answer:
      'You can provision and launch a merchant store in under 5 minutes. Select a template, customize your colors, and your store is live on a custom subdomain.',
  },
  {
    id: 'faq-3',
    category: 'Pricing',
    question: 'Is there a free trial period?',
    answer:
      'Yes! Every plan includes a 14-day full-featured free trial with no credit card required to get started.',
  },
  {
    id: 'faq-4',
    category: 'Pricing',
    question: 'What happens if I exceed my monthly order limit?',
    answer:
      'You will receive a low-threshold notification. Your store will remain active, and you can upgrade your plan or pay for excess orders without disruption.',
  },
  {
    id: 'faq-5',
    category: 'POS',
    question: 'Does the POS work with thermal barcode printers?',
    answer:
      'Yes! The retail POS interface supports standard USB and Bluetooth thermal receipt printers, barcode scanners, and cash drawers.',
  },
  {
    id: 'faq-6',
    category: 'POS',
    question: 'Can I use the POS offline when internet disconnects?',
    answer:
      'Yes, the POS operates in offline cache mode and automatically syncs all sales transactions to the cloud once connectivity is restored.',
  },
  {
    id: 'faq-7',
    category: 'Online Store',
    question: 'Can I map my own custom domain (e.g. www.myshop.com)?',
    answer:
      'Yes! Professional and Enterprise plans support custom domain mapping with automated SSL certificate provisioning.',
  },
  {
    id: 'faq-8',
    category: 'Payments & Logistics',
    question: 'Which Bangladesh couriers are supported out of the box?',
    answer:
      'We support direct API auto-booking with Steadfast, Pathao, RedX, and Paperfly with automated Cash on Delivery (COD) tracking.',
  },
];

const CATEGORIES = ['All', 'General', 'Pricing', 'POS', 'Online Store', 'Payments & Logistics'] as const;

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="ag-faq-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            HELP & KNOWLEDGE BASE
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            Frequently Asked Questions
          </h1>
          <p className="ag-hero-subtitle">
            Find answers to common questions about Antigravity multi-tenancy, POS, logistics, and billing.
          </p>

          {/* Dynamic Search Bar */}
          <div style={{ width: '100%', maxWidth: '32rem', marginTop: '1rem' }}>
            <Input
              type="text"
              placeholder="🔍 Search questions or keywords (e.g. POS, courier, domain)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ag-page-container" style={{ maxWidth: '48rem' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ag-btn ag-btn-sm ${selectedCategory === cat ? 'ag-btn-primary' : 'ag-btn-outline'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion FAQ List */}
        {filteredFaqs.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>No questions found matching "{searchQuery}".</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;

              return (
                <Card key={faq.id} style={{ cursor: 'pointer' }} onClick={() => toggleAccordion(faq.id)}>
                  <CardHeader style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="ag-card-title" style={{ fontSize: '1.0625rem' }}>
                        {faq.question}
                      </span>
                      <span style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginLeft: '1rem' }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                  </CardHeader>

                  {isOpen && (
                    <CardContent style={{ padding: '0 1.5rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
