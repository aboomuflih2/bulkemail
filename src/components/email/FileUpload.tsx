import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Recipient } from '../../types/email';
import { apiFetch } from '../../lib/api';

interface FileUploadProps {
  onRecipientsChange: (recipients: Recipient[]) => void;
  recipients: Recipient[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onRecipientsChange, recipients }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/api/email/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onRecipientsChange(result.data);
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      alert('File upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const allowedExtensions = ['csv', 'xlsx', 'xls'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        handleFileUpload(file);
      } else {
        alert('Please upload a CSV or XLSX file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearRecipients = () => {
    onRecipientsChange([]);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Upload Recipients File (CSV/XLSX) *
      </label>
      
      <div
        className={`drag-zone ${
          isDragging ? 'drag-zone-active' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={isUploading}
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: CSV, XLSX. Max file size: 10MB
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Uploading and processing file...</span>
          </div>
        </div>
      )}

      {recipients.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                {recipients.length} recipients loaded
              </span>
            </div>
            <button
              type="button"
              onClick={clearRecipients}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="max-h-32 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {recipients.slice(0, 10).map((recipient, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-green-700">{recipient.name}</span>
                  <span className="text-green-600">{recipient.email}</span>
                </div>
              ))}
            </div>
            {recipients.length > 10 && (
              <p className="text-green-600 text-xs mt-2">
                ...and {recipients.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
