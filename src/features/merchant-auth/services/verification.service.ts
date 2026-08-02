import { OTPType, OTPVerification } from '../../../types/merchant-auth.types';
import { generateOTPCode, hashOTPCode, verifyOTPCode } from '../../../lib/auth-security';
import { notificationService } from './notification.service';

export interface SendOTPResult {
  identifier: string;
  type: OTPType;
  expiresAt: string;
  deliveryChannel: 'EMAIL' | 'SMS';
  success: boolean;
}

/**
 * Enterprise Service for 6-Digit OTP Generation, Hashing, Expiration Control, and Verification.
 */
export class VerificationService {
  private static instance: VerificationService | null = null;
  private otpStore: Map<string, OTPVerification> = new Map();

  private constructor() {}

  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  /**
   * Generates a 6-digit OTP, hashes it, stores with 5-minute expiry, and triggers Email/SMS delivery.
   */
  public async sendOTP(identifier: string, type: OTPType): Promise<SendOTPResult> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const rawCode = generateOTPCode();
    const codeHash = hashOTPCode(cleanIdentifier, rawCode);

    const now = Date.now();
    const expiresAt = new Date(now + 5 * 60000).toISOString(); // 5 minutes validity

    const otpRecord: OTPVerification = {
      id: `otp-${now}-${Math.random().toString(36).substring(2, 6)}`,
      identifier: cleanIdentifier,
      codeHash,
      type,
      expiresAt,
      isUsed: false,
      createdAt: new Date(now).toISOString(),
    };

    const storeKey = `${cleanIdentifier}:${type}`;
    this.otpStore.set(storeKey, otpRecord);

    const isEmail = cleanIdentifier.includes('@');
    const channel: 'EMAIL' | 'SMS' = isEmail ? 'EMAIL' : 'SMS';

    if (isEmail) {
      await notificationService.sendEmail({
        to: cleanIdentifier,
        subject: `Your Antigravity Verification Code: ${rawCode}`,
        html: `<p>Your 6-digit verification code is <strong>${rawCode}</strong>. Valid for 5 minutes.</p>`,
      });
    } else {
      await notificationService.sendSMS({
        toPhone: cleanIdentifier,
        message: `Your Antigravity OTP code is ${rawCode}. Valid for 5 minutes. Do not share.`,
      });
    }

    return {
      identifier: cleanIdentifier,
      type,
      expiresAt,
      deliveryChannel: channel,
      success: true,
    };
  }

  /**
   * Validates a 6-digit OTP code against stored hash and 5-minute expiration timestamp.
   */
  public async verifyOTP(identifier: string, code: string, type: OTPType): Promise<boolean> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const storeKey = `${cleanIdentifier}:${type}`;
    const otpRecord = this.otpStore.get(storeKey);

    if (!otpRecord) return false;
    if (otpRecord.isUsed) return false;

    const isValid = verifyOTPCode(cleanIdentifier, code, otpRecord.codeHash, otpRecord.expiresAt);
    if (!isValid) return false;

    // Mark OTP as used to prevent replay attacks
    otpRecord.isUsed = true;
    this.otpStore.set(storeKey, otpRecord);
    return true;
  }
}

export const verificationService = VerificationService.getInstance();
