'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

interface CSVUploadProps {
  onUpload: (data: any[]) => Promise<void>;
  expectedHeaders?: string[];
  title?: string;
}

export function CSVUpload({ onUpload, expectedHeaders, title = 'Upload CSV' }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Validate headers if expected headers are provided
            if (expectedHeaders && results.meta.fields) {
              const missingHeaders = expectedHeaders.filter(
                (h) => !results.meta.fields?.includes(h)
              );
              if (missingHeaders.length > 0) {
                setError(`Missing required columns: ${missingHeaders.join(', ')}`);
                setUploading(false);
                return;
              }
            }

            await onUpload(results.data);
            setSuccess(true);
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (err: any) {
            setError(err.message || 'Upload failed');
          } finally {
            setUploading(false);
          }
        },
        error: (err: any) => {
          setError(`Failed to parse CSV: ${err.message}`);
          setUploading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to read file');
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {expectedHeaders && (
            <p className="mt-2 text-xs text-gray-500">
              Required columns: {expectedHeaders.join(', ')}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">Upload successful!</div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
