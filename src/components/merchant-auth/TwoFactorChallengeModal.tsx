import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface TwoFactorChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyTOTP: (totpToken: string) => Promise<boolean>;
}

export const TwoFactorChallengeModal: React.FC<TwoFactorChallengeModalProps> = ({
  isOpen,
  onClose,
  onVerifyTOTP,
}) => {
  const [totpToken, setTotpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (totpToken.trim().length !== 6) {
      setErrorMessage('Please enter 6-digit TOTP security code.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onVerifyTOTP(totpToken.trim());
      setIsLoading(false);
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Invalid 2FA security code. Please check your Authenticator app.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to verify 2FA code.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Two-Factor Authentication Required">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
          Open your Google Authenticator or Authy app and enter the 6-digit security code.
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
            value={totpToken}
            onChange={(e) => setTotpToken(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
            required
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
            Authenticate & Log In
          </Button>
        </form>
      </div>
    </Modal>
  );
};
