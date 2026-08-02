import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  onVerifySubmit: (code: string) => Promise<boolean>;
  onResendOTP?: () => Promise<void>;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  identifier,
  onVerifySubmit,
  onResendOTP,
}) => {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let timer: any;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (code.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onVerifySubmit(code.trim());
      setIsLoading(false);

      if (ok) {
        onClose();
      } else {
        setErrorMessage('Invalid or expired OTP code.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to verify OTP code.');
    }
  };

  const handleResend = async () => {
    if (onResendOTP && countdown === 0) {
      await onResendOTP();
      setCountdown(60);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="6-Digit OTP Verification">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
          Enter the 6-digit verification code sent to <strong>{identifier}</strong>.
        </p>

        {errorMessage && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            type="text"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>
              Didn't receive code? {countdown > 0 ? `Resend in ${countdown}s` : ''}
            </span>
            <button
              type="button"
              disabled={countdown > 0}
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: countdown === 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                cursor: countdown === 0 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Resend Code
            </button>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
            Verify & Continue
          </Button>
        </form>
      </div>
    </Modal>
  );
};
