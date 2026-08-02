import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';

export interface MerchantLoginFormProps {
  onLoginSubmit: (credentials: { emailOrSubdomain: string; password: string; rememberMe: boolean }) => Promise<{
    success: boolean;
    requiresTwoFactor?: boolean;
    requiresOTPVerification?: boolean;
    error?: string;
  }>;
  onForgotPasswordClick?: () => void;
  onRegisterClick?: () => void;
  onTwoFactorTrigger?: () => void;
  onOTPTrigger?: () => void;
}

export const MerchantLoginForm: React.FC<MerchantLoginFormProps> = ({
  onLoginSubmit,
  onForgotPasswordClick,
  onRegisterClick,
  onTwoFactorTrigger,
  onOTPTrigger,
}) => {
  const [emailOrSubdomain, setEmailOrSubdomain] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrSubdomain.trim() || !password) {
      setErrorMessage('Please enter both email/phone and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await onLoginSubmit({ emailOrSubdomain, password, rememberMe });
      setIsLoading(false);

      if (!res.success) {
        if (res.requiresTwoFactor && onTwoFactorTrigger) {
          onTwoFactorTrigger();
          return;
        }
        if (res.requiresOTPVerification && onOTPTrigger) {
          onOTPTrigger();
          return;
        }
        setErrorMessage(res.error || 'Login failed. Please check credentials.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred during login.');
    }
  };

  return (
    <Card className="ag-merchant-login-card">
      <CardHeader style={{ textAlign: 'center' }}>
        <div className="ag-navbar-logo-icon" style={{ margin: '0 auto 0.75rem', width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
          ⚡
        </div>
        <CardTitle style={{ fontSize: '1.5rem' }}>Merchant Portal Sign In</CardTitle>
        <CardDescription>Enter your email or phone number to access your store</CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--border-radius)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Email or Phone Number"
            type="text"
            placeholder="owner@store.com or +8801711002233"
            value={emailOrSubdomain}
            onChange={(e) => setEmailOrSubdomain(e.target.value)}
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            }
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me (30 days)
            </label>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
            >
              Forgot Password?
            </button>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Sign In to Storefront
          </Button>
        </form>
      </CardContent>

      <CardFooter style={{ justifyContent: 'center', backgroundColor: 'transparent', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Don't have a merchant account yet?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Start Free Trial
          </button>
        </span>
      </CardFooter>
    </Card>
  );
};
