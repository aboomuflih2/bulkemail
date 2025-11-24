import React, { useState } from 'react';
import EmailComposer from '../components/email/EmailComposer';
import { Recipient, SendEmailRequest } from '../types/email';
import { apiFetch } from '../lib/api';

const EmailSender: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');

  const handleSendEmails = async (data: {
    subject: string;
    message: string;
    cc?: string;
    provider: 'gmail' | 'outlook' | 'smtp';
    recipients: Recipient[];
    smtpConfig?: any;
  }) => {
    setIsLoading(true);
    setJobId('');
    setJobStatus('');

    try {
      const requestData: SendEmailRequest = {
        subject: data.subject,
        message: data.message,
        cc: data.cc,
        provider: data.provider,
        recipients: data.recipients,
        smtpConfig: data.smtpConfig
      };

      const response = await apiFetch('/api/email/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setJobId(result.jobId);
        setJobStatus('processing');
        
        // Start polling for status updates
        pollJobStatus(result.jobId);
      } else {
        alert(`Failed to start email sending: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to send emails. Please try again.');
      console.error('Send emails error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const response = await apiFetch(`/api/email/status/${jobId}`);
        const data = await response.json();

        if (response.ok) {
          setJobStatus(data.status);
          
          if (data.status === 'completed' || data.status === 'failed') {
            return true; // Stop polling
          }
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
      }
      return false; // Continue polling
    };

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 2000);

    // Initial check
    checkStatus();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EmailComposer
        onSendEmails={handleSendEmails}
        recipients={recipients}
        onRecipientsChange={setRecipients}
        isLoading={isLoading}
        jobId={jobId}
        jobStatus={jobStatus}
      />
    </div>
  );
};

export default EmailSender;
