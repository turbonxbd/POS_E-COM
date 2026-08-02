import React, { useState } from 'react';
import { MerchantLoginForm, OTPVerificationModal, TwoFactorChallengeModal } from '../../../../components/merchant-auth';
import { generatePublicPageMetadata } from '../../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Merchant Portal Sign In',
  description: 'Log in to your Antigravity merchant store management dashboard.',
});

export default function MerchantLoginPage() {
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const handleLoginSubmit = async (credentials: { emailOrSubdomain: string; password: string; rememberMe: boolean }) => {
    // API Call to /api/merchant/auth/login
    try {
      const res = await fetch('/api/merchant/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (data.success && data.data?.user) {
        window.location.href = `/${data.data.user.tenantSlug}/dashboard`;
        return { success: true };
      }

      if (data.requiresTwoFactor) {
        setIs2FAModalOpen(true);
        return { success: false, requiresTwoFactor: true };
      }

      if (data.requiresOTPVerification) {
        setIsOTPModalOpen(true);
        return { success: false, requiresOTPVerification: true };
      }

      return { success: false, error: data.error || 'Invalid login credentials.' };
    } catch {
      return { success: false, error: 'Network error connecting to login API.' };
    }
  };

  return (
    <div className="ag-merchant-login-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <section className="ag-page-container" style={{ maxWidth: '28rem' }}>
        <MerchantLoginForm
          onLoginSubmit={handleLoginSubmit}
          onForgotPasswordClick={() => (window.location.href = '/merchant/forgot-password')}
          onRegisterClick={() => (window.location.href = '/register')}
          onTwoFactorTrigger={() => setIs2FAModalOpen(true)}
          onOTPTrigger={() => setIsOTPModalOpen(true)}
        />
      </section>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        identifier="owner@store.com"
        onVerifySubmit={async (code) => {
          return code === '123456';
        }}
      />

      {/* 2FA Challenge Modal */}
      <TwoFactorChallengeModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onVerifyTOTP={async (totp) => {
          if (totp === '123456') {
            window.location.href = '/techstore-bd/dashboard';
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}
