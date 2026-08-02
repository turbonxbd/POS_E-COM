import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { generatePublicPageMetadata } from '../../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Verify Your Merchant Account',
  description: 'Enter your 6-digit OTP verification code to activate your account.',
});

export default function MerchantVerifyPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (code.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/merchant/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@store.com', code: code.trim() }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/techstore-bd/dashboard';
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Invalid verification code.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to verify OTP code.');
    }
  };

  return (
    <div className="ag-merchant-verify-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <section className="ag-page-container" style={{ maxWidth: '28rem' }}>
        <Card>
          <CardHeader style={{ textAlign: 'center' }}>
            <CardTitle style={{ fontSize: '1.5rem' }}>Account Verification Required</CardTitle>
            <CardDescription>Enter the 6-digit OTP code sent to your email/phone to complete activation.</CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🎉</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account Verified!</h4>
                <p style={{ fontSize: '0.9375rem', color: 'var(--muted-foreground)' }}>
                  Redirecting to your merchant dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {errorMessage && (
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                  required
                />

                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
                  Verify & Proceed to Dashboard
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
