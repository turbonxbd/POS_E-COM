import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Book a Live Product Demo',
  description: 'Schedule a personalized 1-on-1 walkthrough with an Antigravity SaaS product specialist.',
});

export interface DemoFormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  preferredDate: string;
  preferredTime: string;
}

export default function DemoPage() {
  const [formData, setFormData] = useState<DemoFormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: 'retail',
    preferredDate: '',
    preferredTime: '10:00 AM',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      errs.businessName = 'Business name is required.';
    }
    if (!formData.ownerName.trim()) {
      errs.ownerName = 'Your name is required.';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Valid email address is required.';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      errs.phone = 'Valid phone number is required.';
    }
    if (!formData.preferredDate) {
      errs.preferredDate = 'Please select a preferred date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="ag-demo-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            PERSONALIZED DEMO
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            See Antigravity in Action
          </h1>
          <p className="ag-hero-subtitle">
            Book a 1-on-1 walkthrough tailored to your retail, wholesale, or multi-tenant business goals.
          </p>
        </div>
      </section>

      <section className="ag-page-container" style={{ maxWidth: '42rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Schedule Your 1-on-1 Product Demo</CardTitle>
            <CardDescription>Fill out the form below and our solution engineer will connect with you.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Demo Request Confirmed!
                </h3>
                <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
                  Thank you, <strong>{formData.ownerName}</strong>. We have scheduled your demo for{' '}
                  <strong>{formData.businessName}</strong> on <strong>{formData.preferredDate}</strong> at{' '}
                  <strong>{formData.preferredTime}</strong>. A calendar invite has been sent to <strong>{formData.email}</strong>.
                </p>
                <Button variant="outline" size="md" onClick={() => setIsSubmitted(false)}>
                  Book Another Demo
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                  label="Business Name"
                  placeholder="e.g. TechStore BD"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  error={errors.businessName}
                />

                <Input
                  label="Your Full Name"
                  placeholder="e.g. Rahim Ahmed"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  error={errors.ownerName}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Work Email"
                    type="email"
                    placeholder="rahim@techstore.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+880 1711 002233"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                  />
                </div>

                <div className="ag-input-wrapper">
                  <label className="ag-input-label">Business Category</label>
                  <select
                    className="ag-input"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  >
                    <option value="retail">Single Retail Shop</option>
                    <option value="multi_branch">Multi-Branch Retail Chain</option>
                    <option value="ecommerce">Online Storefront</option>
                    <option value="wholesale">Wholesale & Distributor</option>
                    <option value="saas_operator">SaaS Multi-Tenant Operator</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Preferred Date"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    error={errors.preferredDate}
                  />

                  <div className="ag-input-wrapper">
                    <label className="ag-input-label">Preferred Time Slot</label>
                    <select
                      className="ag-input"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    >
                      <option value="10:00 AM">10:00 AM (BDT)</option>
                      <option value="02:00 PM">02:00 PM (BDT)</option>
                      <option value="05:00 PM">05:00 PM (BDT)</option>
                      <option value="08:00 PM">08:00 PM (BDT)</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" style={{ marginTop: '0.5rem' }}>
                  Confirm Demo Booking
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
