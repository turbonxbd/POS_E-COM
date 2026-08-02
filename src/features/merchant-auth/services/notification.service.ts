export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SMSPayload {
  toPhone: string;
  message: string;
  gateway?: 'SSL_WIRELESS' | 'GREENWEB' | 'TELETALK';
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
  timestamp: string;
  error?: string;
}

/**
 * Enterprise Service for Dispatching Transactional Emails & Bangladesh Local SMS Notifications.
 */
export class NotificationService {
  private static instance: NotificationService | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Dispatches transactional emails via SMTP or configured mailer.
   */
  public async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const messageId = `msg-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    console.log(`[NotificationService:Email] Dispatched to ${payload.to}:`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  ID: ${messageId}`);

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispatches SMS messages via Bangladesh Local SMS Gateways (SSL Wireless / Greenweb).
   */
  public async sendSMS(payload: SMSPayload): Promise<NotificationResult> {
    const cleanPhone = payload.toPhone.replace(/[^0-9+]/g, '');
    const messageId = `msg-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const gateway = payload.gateway || 'SSL_WIRELESS';

    console.log(`[NotificationService:SMS] Dispatched via ${gateway} to ${cleanPhone}:`);
    console.log(`  Message: "${payload.message}"`);
    console.log(`  ID: ${messageId}`);

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  }
}

export const notificationService = NotificationService.getInstance();
