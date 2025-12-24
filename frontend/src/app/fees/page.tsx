'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { DataTable } from '@/components/DataTable';
import { apiClient } from '@/lib/api-client';
import { OfflineStorage } from '@/lib/offline-storage';
import { useAuth } from '@/contexts/AuthContext';

interface Invoice {
  id: string;
  student_id: string;
  student_name?: string;
  session: string;
  amount: number;
  amount_paid: number;
  status: string;
}

export default function FeesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadInvoices();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadInvoices = async () => {
    try {
      if (OfflineStorage.isOnline()) {
        const endpoint = user?.role === 'STUDENT'
          ? `/api/invoices/student/${user.id}`
          : '/api/invoices';
        
        const response = await apiClient.get(endpoint);
        setInvoices(response.data);
        
        // Cache for offline access
        OfflineStorage.set('invoices', response.data);
      } else {
        const cached = OfflineStorage.get<Invoice[]>('invoices');
        if (cached) {
          setInvoices(cached);
        }
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
      const cached = OfflineStorage.get<Invoice[]>('invoices');
      if (cached) {
        setInvoices(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!isOnline) {
      alert('You must be online to export reports');
      return;
    }

    try {
      const response = await apiClient.get('/api/invoices/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export report');
    }
  };

  const columns = user?.role === 'STUDENT'
    ? [
        { key: 'session', label: 'Session' },
        {
          key: 'amount',
          label: 'Amount',
          render: (invoice: Invoice) => `₦${invoice.amount.toLocaleString()}`,
        },
        {
          key: 'amount_paid',
          label: 'Paid',
          render: (invoice: Invoice) => `₦${invoice.amount_paid.toLocaleString()}`,
        },
        {
          key: 'balance',
          label: 'Balance',
          render: (invoice: Invoice) => 
            `₦${(invoice.amount - invoice.amount_paid).toLocaleString()}`,
        },
        {
          key: 'status',
          label: 'Status',
          render: (invoice: Invoice) => (
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                invoice.status === 'fully_paid'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'partially_paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status.replace('_', ' ')}
            </span>
          ),
        },
      ]
    : [
        { key: 'student_id', label: 'Student ID' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'session', label: 'Session' },
        {
          key: 'amount',
          label: 'Amount',
          render: (invoice: Invoice) => `₦${invoice.amount.toLocaleString()}`,
        },
        {
          key: 'amount_paid',
          label: 'Paid',
          render: (invoice: Invoice) => `₦${invoice.amount_paid.toLocaleString()}`,
        },
        {
          key: 'status',
          label: 'Status',
          render: (invoice: Invoice) => (
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                invoice.status === 'fully_paid'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'partially_paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status.replace('_', ' ')}
            </span>
          ),
        },
      ];

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'FINANCE', 'ADMIN']}>
      <Layout>
        <div className="px-4 sm:px-0">
          {!isOnline && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                You are offline. Viewing cached data.
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === 'STUDENT' ? 'My Fees' : 'Fee Management'}
            </h1>
            {(user?.role === 'FINANCE' || user?.role === 'ADMIN') && (
              <button
                onClick={handleExportReport}
                disabled={!isOnline}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                Export Report
              </button>
            )}
          </div>

          <DataTable
            data={invoices}
            columns={columns}
            loading={loading}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
