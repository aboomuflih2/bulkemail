import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Recipient, SMTPConfig } from '../types/email.js';

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!this.instance) {
      this.instance = new EmailService();
    }
    return this.instance;
  }

  async sendEmailWithSMTP(
    recipient: Recipient,
    subject: string,
    message: string,
    cc?: string,
    smtpConfig?: SMTPConfig
  ): Promise<void> {
    if (!smtpConfig) {
      throw new Error('SMTP configuration is required');
    }

    const transporter = (nodemailer as any).default.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const mailOptions = {
      from: smtpConfig.user,
      to: recipient.email,
      cc: cc || undefined,
      subject: this.replacePlaceholders(subject, recipient),
      text: this.replacePlaceholders(message, recipient),
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`SMTP email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendEmailWithGmail(
    recipient: Recipient,
    subject: string,
    message: string,
    cc?: string,
    accessToken?: string
  ): Promise<void> {
    if (!accessToken) {
      throw new Error('Gmail access token is required');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const emailContent = [
      `To: ${recipient.email}`,
      cc ? `Cc: ${cc}` : '',
      `Subject: ${this.replacePlaceholders(subject, recipient)}`,
      '',
      this.replacePlaceholders(message, recipient)
    ].filter(Boolean).join('\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
    } catch (error) {
      throw new Error(`Gmail API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendEmailWithOutlook(
    recipient: Recipient,
    subject: string,
    message: string,
    cc?: string,
    accessToken?: string
  ): Promise<void> {
    if (!accessToken) {
      throw new Error('Outlook access token is required');
    }

    const emailData = {
      message: {
        subject: this.replacePlaceholders(subject, recipient),
        body: {
          contentType: 'Text',
          content: this.replacePlaceholders(message, recipient),
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipient.email,
              name: recipient.name,
            },
          },
        ],
        ccRecipients: cc ? [{ emailAddress: { address: cc } }] : [],
      },
      saveToSentItems: true,
    };

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Outlook API failed: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Outlook email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private replacePlaceholders(text: string, recipient: Recipient): string {
    return text.replace(/\{\{name\}\}/g, recipient.name).replace(/\{\{email\}\}/g, recipient.email);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}