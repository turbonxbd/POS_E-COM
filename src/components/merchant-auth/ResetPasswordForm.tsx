import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export interface ResetPasswordFormProps {
  identifier: string;
  onResetSubmit: (code: string, newPassword: string) => Promise<boolean>;
  onSuccessRedirect?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  identifier,
  onResetSubmit,
  onSuccessRedirect,
}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (code.trim().length !== 6) {
      setErrorMessage('Please enter 6-digit recovery OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onResetSubmit(code.trim(), newPassword);
      setIsLoading(false);
      if (ok) {
        setIsSuccess(true);
      } else {
        setErrorMessage('Invalid recovery code or reset failed.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to reset password.');
    }
  };

  return (
    <Card className="ag-reset-password-card">
      <CardHeader style={{ textAlign: 'center' }}>
        <CardTitle style={{ fontSize: '1.5rem' }}>Create New Password</CardTitle>
        <CardDescription>Enter the recovery code sent to {identifier} and your new password</CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>✅</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Password Reset Complete!</h4>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Your password has been updated and active sessions revoked. Please log in with your new credentials.
            </p>
            <Button variant="primary" size="md" onClick={onSuccessRedirect} style={{ width: '100%' }}>
              Proceed to Sign In
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
              label="6-Digit OTP Recovery Code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
              Update Password & Revoke Sessions
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
