import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';

export interface ForgotPasswordFormProps {
  onRequestSubmit: (emailOrPhone: string) => Promise<boolean>;
  onBackToLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onRequestSubmit,
  onBackToLogin,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onRequestSubmit(emailOrPhone.trim());
      setIsLoading(false);
      if (ok) {
        setIsSuccess(true);
      } else {
        setErrorMessage('Failed to send recovery code. Please verify details.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <Card className="ag-forgot-password-card">
      <CardHeader style={{ textAlign: 'center' }}>
        <CardTitle style={{ fontSize: '1.5rem' }}>Reset Your Password</CardTitle>
        <CardDescription>We will send a 6-digit recovery code to your registered email or phone</CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>📩</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Recovery Code Sent!</h4>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Please check your inbox or phone for <strong>{emailOrPhone}</strong>.
            </p>
            <Button variant="outline" size="md" onClick={onBackToLogin} style={{ width: '100%' }}>
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errorMessage && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <Input
              label="Email Address or Phone Number"
              type="text"
              placeholder="owner@store.com or +8801711002233"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
              Send Recovery Code
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter style={{ justifyContent: 'center', backgroundColor: 'transparent', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onBackToLogin}
          style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          ← Back to Sign In
        </button>
      </CardFooter>
    </Card>
  );
};
