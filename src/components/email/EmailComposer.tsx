import React, { useState } from 'react';
import { Send, Upload, Settings } from 'lucide-react';
import { Recipient } from '../../types/email';
import FileUpload from './FileUpload';
import SMTPConfig from './SMTPConfig';
import EmailProgress from './EmailProgress';

interface EmailComposerProps {
  onSendEmails: (data: {
    subject: string;
    message: string;
    cc?: string;
    provider: 'gmail' | 'outlook' | 'smtp';
    recipients: Recipient[];
    smtpConfig?: any;
  }) => void;
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  isLoading: boolean;
  jobId?: string;
  jobStatus?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  onSendEmails,
  recipients,
  onRecipientsChange,
  isLoading,
  jobId,
  jobStatus
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [cc, setCc] = useState('');
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'smtp'>('smtp');
  const [showSMTPConfig, setShowSMTPConfig] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim() || recipients.length === 0) {
      alert('Please fill in all required fields and upload recipients');
      return;
    }

    onSendEmails({
      subject,
      message,
      cc: cc.trim() || undefined,
      provider,
      recipients,
      smtpConfig: provider === 'smtp' ? smtpConfig : undefined
    });
  };

  const handleProviderChange = (newProvider: 'gmail' | 'outlook' | 'smtp') => {
    setProvider(newProvider);
    setShowSMTPConfig(newProvider === 'smtp');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="card p-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-primary-600 mb-6 text-center">
          Bulk Email Sender
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input"
              placeholder="Enter email subject (use {{name}} for personalization)"
              required
            />
          </div>

          {/* Message Body */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message Body *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="form-textarea"
              placeholder="Enter your message (use {{name}} and {{email}} for personalization)"
              required
            />
          </div>

          {/* CC Field */}
          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-2">
              CC (Optional)
            </label>
            <input
              type="text"
              id="cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="form-input"
              placeholder="Enter CC email addresses (comma-separated)"
            />
          </div>

          {/* Email Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Provider *
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as 'gmail' | 'outlook' | 'smtp')}
              className="form-select"
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="smtp">Custom SMTP</option>
            </select>
          </div>

          {/* SMTP Configuration */}
          {showSMTPConfig && (
            <SMTPConfig
              config={smtpConfig}
              onChange={setSmtpConfig}
            />
          )}

          {/* File Upload */}
          <FileUpload
            onRecipientsChange={onRecipientsChange}
            recipients={recipients}
          />

          {/* Send Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || recipients.length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              <span>{isLoading ? 'Sending...' : 'Send Emails'}</span>
            </button>
          </div>
        </form>

        {/* Email Progress */}
        {jobId && jobStatus && (
          <EmailProgress
            jobId={jobId}
            jobStatus={jobStatus}
          />
        )}
      </div>
    </div>
  );
};

export default EmailComposer;
