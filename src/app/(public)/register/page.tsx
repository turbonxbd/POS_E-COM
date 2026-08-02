import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { authStore } from '../../../store/auth.store';
import { tenantStore } from '../../../store/tenant.store';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Start 14-Day Free Trial - Merchant Registration',
  description: 'Provision your multi-tenant eCommerce store in under 5 minutes.',
});

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Info
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business & Subdomain
  const [businessName, setBusinessName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubdomainChecking, setIsSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  // Step 3: Plan
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Subdomain Auto-slugification
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (step === 2 && !subdomain) {
      const slugified = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setSubdomain(slugified);
    }
  };

  const handleSubdomainCheck = () => {
    if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
      setErrors({ subdomain: 'Subdomain must contain lowercase letters, numbers, and hyphens.' });
      setSubdomainAvailable(false);
      return;
    }

    setIsSubdomainChecking(true);
    setTimeout(() => {
      setIsSubdomainChecking(false);
      const isTaken = ['admin', 'api', 'app', 'test'].includes(subdomain.toLowerCase());
      if (isTaken) {
        setSubdomainAvailable(false);
        setErrors({ subdomain: `Subdomain "${subdomain}.domain.com" is already taken.` });
      } else {
        setSubdomainAvailable(true);
        setErrors({});
      }
    }, 600);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!ownerName.trim()) errs.ownerName = 'Your full name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email is required.';
    if (!password || password.length < 6) errs.password = 'Password must be at least 6 characters.';

    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required.';
    if (!subdomain.trim()) errs.subdomain = 'Subdomain is required.';

    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(3);
  };

  const handleProvisionSubmit = () => {
    setStep(4);

    setTimeout(() => {
      const mockTenant = {
        id: `ten-${subdomain}`,
        name: businessName,
        slug: subdomain,
        domain: `${subdomain}.domain.com`,
        resolutionMode: 'subdomain' as const,
        status: 'ACTIVE' as const,
        features: ['pos', 'inventory', 'analytics'],
        theme: { primaryColor: '#2563eb', secondaryColor: '#64748b', darkModeEnabled: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockUser = {
        id: 'usr-new-01',
        email,
        firstName: ownerName.split(' ')[0],
        lastName: ownerName.split(' ')[1] || '',
        role: 'TENANT_ADMIN' as const,
        tenantId: mockTenant.id,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tenantStore.setTenant(mockTenant);
      authStore.setSession({
        user: mockUser,
        accessToken: 'new-tenant-jwt-access-token',
        refreshToken: 'new-tenant-jwt-refresh-token',
        expiresAt: Date.now() + 86400000,
        permissions: ['*'],
      });

      window.location.href = `/${subdomain}/dashboard`;
    }, 2000);
  };

  return (
    <div className="ag-register-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <section className="ag-page-container" style={{ maxWidth: '36rem' }}>
        {/* Step Progress Tracker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <span className={`ag-badge ${step >= 1 ? 'ag-badge-info' : 'ag-badge-outline'}`}>1. Account</span>
          <span style={{ color: 'var(--border)' }}>──────</span>
          <span className={`ag-badge ${step >= 2 ? 'ag-badge-info' : 'ag-badge-outline'}`}>2. Store & Subdomain</span>
          <span style={{ color: 'var(--border)' }}>──────</span>
          <span className={`ag-badge ${step >= 3 ? 'ag-badge-info' : 'ag-badge-outline'}`}>3. Select Plan</span>
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Create Your Owner Account</CardTitle>
                <CardDescription>Step 1 of 3: Enter your personal account details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <Input
                    label="Full Name"
                    placeholder="e.g. Rahim Ahmed"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    error={errors.ownerName}
                    required
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    placeholder="rahim@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    required
                  />
                  <Button type="submit" variant="primary" size="lg" style={{ marginTop: '0.5rem' }}>
                    Continue to Store Details →
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Store & Subdomain Setup</CardTitle>
                <CardDescription>Step 2 of 3: Name your business and choose your store URL</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep2Next} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <Input
                    label="Business / Store Name"
                    placeholder="e.g. TechStore BD"
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    error={errors.businessName}
                    required
                  />

                  <div className="ag-input-wrapper">
                    <label className="ag-input-label">Store Subdomain URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Input
                        placeholder="techstore-bd"
                        value={subdomain}
                        onChange={(e) => {
                          setSubdomain(e.target.value);
                          setSubdomainAvailable(null);
                        }}
                        error={errors.subdomain}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        isLoading={isSubdomainChecking}
                        onClick={handleSubdomainCheck}
                      >
                        Check
                      </Button>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                      Your URL: <strong>https://{subdomain || 'yourstore'}.domain.com</strong>
                    </span>
                    {subdomainAvailable === true && (
                      <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Subdomain is available!
                      </span>
                    )}
                  </div>

                  <Input
                    label="Phone Number (Optional)"
                    placeholder="+880 1711 002233"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
                      ← Back
                    </Button>
                    <Button type="submit" variant="primary" size="lg" style={{ flex: 2 }}>
                      Continue to Plan →
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Select Subscription Plan</CardTitle>
                <CardDescription>Step 3 of 3: All plans come with a 14-day free trial</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div
                    onClick={() => setSelectedPlan('starter')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--border-radius)',
                      border: selectedPlan === 'starter' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.0625rem' }}>Starter Plan ($19/mo)</strong>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>100 Products, 500 Orders/mo</p>
                    </div>
                    {selectedPlan === 'starter' && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓ Selected</span>}
                  </div>

                  <div
                    onClick={() => setSelectedPlan('pro')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--border-radius)',
                      border: selectedPlan === 'pro' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.0625rem' }}>Professional Plan ($49/mo) ★ MOST POPULAR</strong>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>1,000 Products, Custom Domain, Advanced Analytics</p>
                    </div>
                    {selectedPlan === 'pro' && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓ Selected</span>}
                  </div>

                  <div
                    onClick={() => setSelectedPlan('enterprise')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--border-radius)',
                      border: selectedPlan === 'enterprise' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.0625rem' }}>Enterprise Plan ($199/mo)</strong>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Unlimited Products, Multi-Branch, 24/7 Dedicated Support</p>
                    </div>
                    {selectedPlan === 'enterprise' && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓ Selected</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)} style={{ flex: 1 }}>
                    ← Back
                  </Button>
                  <Button type="button" variant="primary" size="lg" onClick={handleProvisionSubmit} style={{ flex: 2 }}>
                    Provision My Storefront 🚀
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <CardContent style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⚡</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Provisioning Your Store...</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Creating database container for <strong>https://{subdomain}.domain.com</strong>...
              </p>
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}
