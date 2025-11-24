import { v4 as uuidv4 } from 'uuid';
import { EmailJob, EmailResult, Recipient, RecipientWithStatus, SendEmailRequest } from '../types/email.js';
import { EmailService } from './emailService.js';

export class EmailJobManager {
  private static instance: EmailJobManager;
  private jobs: Map<string, EmailJob> = new Map();
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  static getInstance(): EmailJobManager {
    if (!this.instance) {
      this.instance = new EmailJobManager();
    }
    return this.instance;
  }

  createJob(request: SendEmailRequest): string {
    const jobId = uuidv4();
    
    const job: EmailJob = {
      id: jobId,
      subject: request.subject,
      message: request.message,
      cc: request.cc,
      provider: request.provider,
      status: 'pending',
      recipients: request.recipients.map(recipient => ({
        ...recipient,
        status: 'pending',
      })),
      createdAt: new Date(),
      smtpConfig: request.smtpConfig,
    };

    this.jobs.set(jobId, job);
    return jobId;
  }

  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    job.status = 'processing';
    
    const results: EmailResult[] = [];
    
    for (let i = 0; i < job.recipients.length; i++) {
      const recipient = job.recipients[i];
      const resultId = uuidv4();
      
      const result: EmailResult = {
        id: resultId,
        jobId,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        status: 'pending',
      };

      try {
        switch (job.provider) {
          case 'smtp':
            if (!job.smtpConfig) {
              throw new Error('SMTP configuration missing for SMTP provider');
            }
            await this.emailService.sendEmailWithSMTP(
              recipient,
              job.subject,
              job.message,
              job.cc,
              job.smtpConfig
            );
            break;
          case 'gmail':
            // For demo purposes, we'll skip Gmail API calls
            // In production, this would require proper OAuth setup
            throw new Error('Gmail API requires OAuth setup');
          case 'outlook':
            // For demo purposes, we'll skip Outlook API calls
            // In production, this would require proper OAuth setup
            throw new Error('Outlook API requires OAuth setup');
          default:
            throw new Error(`Unsupported provider: ${job.provider}`);
        }
        
        result.status = 'sent';
        result.sentAt = new Date();
      } catch (error) {
        result.status = 'failed';
        result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
      
      results.push(result);
      
      // Update the job with current progress
      job.recipients[i] = {
        ...recipient,
        status: result.status === 'sent' ? 'sent' : 'failed',
        error: result.errorMessage,
      };
    }

    job.status = 'completed';
    job.completedAt = new Date();
  }

  getJob(jobId: string): EmailJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): EmailJob[] {
    return Array.from(this.jobs.values());
  }

  getJobResults(jobId: string): EmailResult[] {
    const job = this.jobs.get(jobId);
    if (!job) {
      return [];
    }

    return job.recipients.map((recipient, index) => ({
      id: `${jobId}-${index}`,
      jobId,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      status: recipient.status || 'pending',
      errorMessage: recipient.error,
      sentAt: recipient.status === 'sent' ? new Date() : undefined,
    }));
  }
}
