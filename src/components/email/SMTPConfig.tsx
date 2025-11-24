import React, { useState } from 'react';
import { Settings, CheckCircle, XCircle } from 'lucide-react';

interface SMTPConfigProps {
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  onChange: (config: any) => void;
}

const SMTPConfig: React.FC<SMTPConfigProps> = ({ config, onChange }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleChange = (field: string, value: string | number | boolean) => {
    onChange({ ...config, [field]: value });
  };

  const validateConfig = async () => {
    if (!config.host || !config.port || !config.user || !config.pass) {
      alert('Please fill in all SMTP configuration fields');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      const response = await fetch('/api/email/smtp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.valid) {
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
        alert(result.message || 'SMTP configuration validation failed');
      }
    } catch (error) {
      setValidationStatus('invalid');
      alert('Failed to validate SMTP configuration');
      console.error('SMTP validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          SMTP Configuration
        </h3>
        <button
          type="button"
          onClick={validateConfig}
          disabled={isValidating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Validating...</span>
            </>
          ) : (
            <>
              {validationStatus === 'valid' && <CheckCircle className="h-3 w-3" />}
              {validationStatus === 'invalid' && <XCircle className="h-3 w-3" />}
              <span>Validate</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="smtp-host" className="block text-sm font-medium text-gray-700 mb-1">
            Host *
          </label>
          <input
            type="text"
            id="smtp-host"
            value={config.host}
            onChange={(e) => handleChange('host', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="smtp.gmail.com"
            required
          />
        </div>

        <div>
          <label htmlFor="smtp-port" className="block text-sm font-medium text-gray-700 mb-1">
            Port *
          </label>
          <input
            type="number"
            id="smtp-port"
            value={config.port}
            onChange={(e) => handleChange('port', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="587"
            required
          />
        </div>

        <div>
          <label htmlFor="smtp-user" className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="email"
            id="smtp-user"
            value={config.user}
            onChange={(e) => handleChange('user', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-email@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="smtp-pass" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="smtp-pass"
            value={config.pass}
            onChange={(e) => handleChange('pass', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your email password"
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.secure}
            onChange={(e) => handleChange('secure', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Use secure connection (TLS/SSL)</span>
        </label>
      </div>

      {validationStatus === 'valid' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">SMTP configuration is valid</span>
          </div>
        </div>
      )}

      {validationStatus === 'invalid' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">SMTP configuration validation failed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMTPConfig;