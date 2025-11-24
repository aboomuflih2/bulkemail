export interface Recipient {
  name: string;
  email: string;
}

export interface EmailJob {
  id: string;
  subject: string;
  message: string;
  cc?: string;
  provider: 'gmail' | 'outlook' | 'smtp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipients: Recipient[];
  createdAt: Date;
  completedAt?: Date;
}

export interface EmailResult {
  id: string;
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  sentAt?: Date;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface EmailProviderConfig {
  smtp?: SMTPConfig;
  gmail?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export interface FileUploadResponse {
  success: boolean;
  data: Recipient[];
  message: string;
}

export interface SendEmailRequest {
  subject: string;
  message: string;
  cc?: string;
  provider: 'gmail' | 'outlook' | 'smtp';
  recipients: Recipient[];
  smtpConfig?: SMTPConfig;
}

export interface SendEmailResponse {
  jobId: string;
  status: string;
  results?: EmailResult[];
}