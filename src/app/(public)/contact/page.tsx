import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Contact Support & Sales',
  description: 'Get in touch with the Antigravity customer support and platform sales team.',
});

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: 'Sales Query',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSent, setIsSent] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Valid email is required.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters long.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSent(true);
    }
  };

  return (
    <div className="ag-contact-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            GET IN TOUCH
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            We're Here to Help Your Business Grow
          </h1>
          <p className="ag-hero-subtitle">
            Have questions about multi-tenant onboarding, custom enterprise plans, or technical support? Reach out to us.
          </p>
        </div>
      </section>

      <section className="ag-page-container">
        <div className="ag-features-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Left Column: Support Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Card>
              <CardHeader>
                <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📧</span>
                <CardTitle style={{ fontSize: '1.125rem' }}>Email Support</CardTitle>
                <CardDescription>24/7 Response for technical queries</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@antigravity.app" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  support@antigravity.app
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📞</span>
                <CardTitle style={{ fontSize: '1.125rem' }}>Phone & WhatsApp</CardTitle>
                <CardDescription>Available Mon - Sat (9 AM - 8 PM BDT)</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="tel:+8801711002233" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  +880 1711 002233
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📍</span>
                <CardTitle style={{ fontSize: '1.125rem' }}>Headquarter Office</CardTitle>
                <CardDescription>Dhaka, Bangladesh</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Level 8, Software Technology Park, Gulshan-1, Dhaka-1212, Bangladesh.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <CardDescription>Fill out the form below and our support team will reply within 2 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              {isSent ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>✉️</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Message Sent Successfully!
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
                    Thank you, <strong>{formData.name}</strong>. We have received your query regarding{' '}
                    <strong>{formData.subject}</strong> and will get back to you at <strong>{formData.email}</strong> shortly.
                  </p>
                  <Button variant="outline" size="md" onClick={() => setIsSent(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <Input
                    label="Your Name"
                    placeholder="e.g. Rahim Ahmed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="rahim@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={errors.email}
                    />

                    <Input
                      label="Phone Number (Optional)"
                      type="tel"
                      placeholder="+880 1711 002233"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="ag-input-wrapper">
                    <label className="ag-input-label">Subject</label>
                    <select
                      className="ag-input"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="Sales Query">Sales Query & Custom Plan</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Courier Integration">Courier / Gateway Integration</option>
                      <option value="Partnership">Partnership Inquiry</option>
                    </select>
                  </div>

                  <div className="ag-input-wrapper">
                    <label className="ag-input-label">Your Message</label>
                    <textarea
                      className="ag-input"
                      rows={5}
                      placeholder="How can we help your business?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                    {errors.message && <span className="ag-input-message ag-input-message-error">{errors.message}</span>}
                  </div>

                  <Button type="submit" variant="primary" size="lg">
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
