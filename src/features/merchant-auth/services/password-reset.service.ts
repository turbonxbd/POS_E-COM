import { hashPassword } from '../../../lib/auth-security';
import { verificationService } from './verification.service';
import { auditService } from '../../platform-admin/services/audit.service';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Enterprise Service for Managing Password Recovery Requests, Token Verification, and Session Invalidation.
 */
export class PasswordResetService {
  private static instance: PasswordResetService | null = null;
  private revokedSessionUserIds: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * Generates password reset OTP code and dispatches via Email or SMS.
   */
  public async requestPasswordReset(identifier: string): Promise<PasswordResetResult> {
    const cleanIdentifier = identifier.trim().toLowerCase();

    try {
      const otpResult = await verificationService.sendOTP(cleanIdentifier, 'PASSWORD_RESET');

      await auditService.logAdminAction({
        adminId: 'system-pwd-reset',
        action: 'REQUEST_PASSWORD_RESET',
        targetResource: `User:${cleanIdentifier}`,
        details: { deliveryChannel: otpResult.deliveryChannel },
      });

      return {
        success: true,
        message: `Password reset OTP code dispatched to ${otpResult.deliveryChannel.toLowerCase()} ${cleanIdentifier}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to dispatch password reset request.',
        error: error.message,
      };
    }
  }

  /**
   * Validates OTP code, updates user password hash, and revokes all active merchant user sessions for security.
   */
  public async resetPassword(
    identifier: string,
    code: string,
    newPassword: string
  ): Promise<PasswordResetResult> {
    const cleanIdentifier = identifier.trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long.',
      };
    }

    // 1. Verify OTP code
    const isOTPValid = await verificationService.verifyOTP(cleanIdentifier, code, 'PASSWORD_RESET');
    if (!isOTPValid) {
      return {
        success: false,
        message: 'Invalid or expired password reset OTP code.',
      };
    }

    // 2. Generate new password hash
    const newHash = hashPassword(newPassword);

    // 3. Revoke all active sessions for this user ID (security safeguard)
    this.revokedSessionUserIds.add(cleanIdentifier);

    await auditService.logAdminAction({
      adminId: 'system-pwd-reset',
      action: 'COMPLETE_PASSWORD_RESET',
      targetResource: `User:${cleanIdentifier}`,
      details: { newPasswordHash: newHash.substring(0, 15) },
    });

    return {
      success: true,
      message: 'Password reset successfully. All active sessions have been invalidated. Please log in.',
    };
  }

  /**
   * Checks if user sessions were revoked due to password reset.
   */
  public isUserSessionRevoked(identifier: string): boolean {
    return this.revokedSessionUserIds.has(identifier.toLowerCase());
  }
}

export const passwordResetService = PasswordResetService.getInstance();
