import { sendEmailViaGmail, wrapInBrandedEmailTemplate, getCachedGmailAccount, getInMemoryGmailToken } from './gmailService';

/**
 * Transactional Email Provider Abstraction
 * Powered by Google Workspace Gmail REST API & Fallback
 */
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  recipientName?: string;
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
  channel?: 'gmail_api' | 'simulated_fallback';
  error?: string;
  threadId?: string;
  senderEmail?: string;
}

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;
  sendBatch(payloads: EmailPayload[]): Promise<EmailSendResult[]>;
}

export class PluggableEmailProvider implements EmailProvider {
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'ournextgenacademy@gmail.com';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    
    // Format HTML if raw text or partial HTML provided
    const formattedHtml = payload.html.includes('<!DOCTYPE html>')
      ? payload.html
      : wrapInBrandedEmailTemplate(payload.html, payload.subject, payload.recipientName);

    // Dispatch using Google Gmail API
    const result = await sendEmailViaGmail({
      to: recipients,
      subject: payload.subject,
      html: formattedHtml,
      text: payload.text,
      fromName: 'NextGen Academy Admissions',
      replyTo: payload.replyTo || this.defaultFrom,
    });

    return {
      messageId: result.messageId,
      success: result.success,
      timestamp: result.timestamp,
      recipientCount: result.recipientCount,
      channel: result.deliveryChannel,
      error: result.error,
      threadId: result.threadId,
      senderEmail: result.senderEmail,
    };
  }

  async sendBatch(payloads: EmailPayload[]): Promise<EmailSendResult[]> {
    return Promise.all(payloads.map(p => this.sendEmail(p)));
  }
}

export const emailProvider: EmailProvider = new PluggableEmailProvider();

