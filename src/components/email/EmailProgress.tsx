import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface EmailProgressProps {
  jobId: string;
  jobStatus: string;
}

interface JobProgress {
  total: number;
  sent: number;
  failed: number;
  remaining: number;
}

interface EmailResult {
  id: string;
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  sentAt?: string;
}

const EmailProgress: React.FC<EmailProgressProps> = ({ jobId, jobStatus }) => {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchProgress = async () => {
      try {
        const response = await apiFetch(`/api/email/status/${jobId}`);
        const data = await response.json();

        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.results) {
          setResults(data.results);
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();

    // Poll for updates if job is still processing
    const interval = setInterval(() => {
      if (jobStatus === 'processing') {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    switch (status) {
      case 'sent':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading progress...</span>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="text-center py-8 text-gray-500">
          <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No progress data available</p>
        </div>
      </div>
    );
  }

  const percentage = progress.total > 0 ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;

  return (
    <div className="card p-6 mt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-600 flex items-center">
          <Send className="h-5 w-5 mr-2" />
          Email Sending Progress
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          jobStatus === 'completed' ? 'bg-green-100 text-green-800' :
          jobStatus === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {jobStatus === 'completed' ? 'Completed' :
           jobStatus === 'failed' ? 'Failed' :
           jobStatus === 'processing' ? 'Processing' : 'Pending'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{progress.sent + progress.failed} of {progress.total} emails processed</span>
          <span>{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
          <div className="text-sm text-green-700">Sent</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{progress.remaining}</div>
          <div className="text-sm text-yellow-700">Remaining</div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Email Results</h4>
          <div className="table-responsive max-h-64 overflow-y-auto custom-scrollbar border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {result.recipientName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {result.recipientEmail}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <span className={getStatusBadge(result.status)}>
                          {result.status}
                        </span>
                      </div>
                      {result.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          {result.errorMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {jobStatus === 'completed' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              Email sending completed! {progress.sent} emails sent successfully.
              {progress.failed > 0 && ` ${progress.failed} emails failed.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailProgress;
