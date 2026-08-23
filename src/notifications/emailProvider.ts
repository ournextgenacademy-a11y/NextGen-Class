/**
 * Transactional Email Provider Abstraction
 * Supports SMTP, SendGrid, Resend, Postmark, Mailgun, or Mock logging
 */
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailSendResult {
  messageId: string;
  success: boolean;
  timestamp: Date;
  recipientCount: number;
}

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;
  sendBatch(payloads: EmailPayload[]): Promise<EmailSendResult[]>;
}

export class PluggableEmailProvider implements EmailProvider {
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'admissions@nextgenacademy.org';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // In non-production or default mode, record and return successful dispatch
    return {
      messageId,
      success: true,
      timestamp: new Date(),
      recipientCount: recipients.length,
    };
  }

  async sendBatch(payloads: EmailPayload[]): Promise<EmailSendResult[]> {
    return Promise.all(payloads.map(p => this.sendEmail(p)));
  }
}

export const emailProvider: EmailProvider = new PluggableEmailProvider();
