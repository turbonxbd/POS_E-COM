import React, { useState } from 'react';
import { ForgotPasswordForm, ResetPasswordForm } from '../../../../components/merchant-auth';
import { generatePublicPageMetadata } from '../../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Merchant Password Recovery',
  description: 'Request a password recovery code for your merchant account.',
});

export default function MerchantForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');

  const handleRequestSubmit = async (emailOrPhone: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/merchant/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setIdentifier(emailOrPhone);
        setStep('reset');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResetSubmit = async (code: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/merchant/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, newPassword }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  };

  return (
    <div className="ag-merchant-forgot-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <section className="ag-page-container" style={{ maxWidth: '28rem' }}>
        {step === 'request' ? (
          <ForgotPasswordForm
            onRequestSubmit={handleRequestSubmit}
            onBackToLogin={() => (window.location.href = '/merchant/login')}
          />
        ) : (
          <ResetPasswordForm
            identifier={identifier}
            onResetSubmit={handleResetSubmit}
            onSuccessRedirect={() => (window.location.href = '/merchant/login')}
          />
        )}
      </section>
    </div>
  );
}
