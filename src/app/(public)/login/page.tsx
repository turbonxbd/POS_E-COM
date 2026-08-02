import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { authStore } from '../../../store/auth.store';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Merchant & Staff Login',
  description: 'Log in to your Antigravity merchant store or platform administration portal.',
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate login auth API call
      setTimeout(() => {
        setIsLoading(false);

        const mockUser = {
          id: 'usr-demo-01',
          email,
          firstName: 'Merchant',
          lastName: 'Owner',
          role: 'TENANT_ADMIN' as const,
          tenantId: 'techstore-bd',
          status: 'ACTIVE' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        authStore.setSession({
          user: mockUser,
          accessToken: 'demo-jwt-access-token',
          refreshToken: 'demo-jwt-refresh-token',
          expiresAt: Date.now() + 86400000,
          permissions: ['*'],
        });

        window.location.href = '/techstore-bd/dashboard';
      }, 1000);
    } catch {
      setIsLoading(false);
      setErrorMessage('Invalid email or password credentials.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail.trim().length > 0) {
      setForgotSubmitted(true);
    }
  };

  return (
    <div className="ag-login-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <section className="ag-page-container" style={{ maxWidth: '28rem' }}>
        <Card>
          <CardHeader style={{ textAlign: 'center' }}>
            <div className="ag-navbar-logo-icon" style={{ margin: '0 auto 0.75rem', width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
              ⚡
            </div>
            <CardTitle style={{ fontSize: '1.5rem' }}>Welcome Back</CardTitle>
            <CardDescription>Log in to manage your eCommerce store</CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Email or Store ID"
                type="text"
                placeholder="owner@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                Log In to Dashboard
              </Button>
            </form>
          </CardContent>

          <CardFooter style={{ justifyContent: 'center', backgroundColor: 'transparent', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Don't have a store yet?{' '}
              <a href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Start 14-Day Free Trial
              </a>
            </span>
          </CardFooter>
        </Card>
      </section>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset Your Password">
        {forgotSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📧</span>
            <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)' }}>
              Password reset link sent to <strong>{forgotEmail}</strong>. Please check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Enter your email address and we'll send you a password reset link.
            </p>
            <Input
              type="email"
              placeholder="owner@store.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="md">
              Send Reset Link
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
