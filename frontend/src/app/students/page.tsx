'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { DataTable } from '@/components/DataTable';
import { CSVUpload } from '@/components/CSVUpload';
import { apiClient } from '@/lib/api-client';
import { OfflineStorage } from '@/lib/offline-storage';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  faculty: string;
  department: string;
  level: number;
  enrollment_status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStudents();
    
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStudents = async () => {
    try {
      if (OfflineStorage.isOnline()) {
        const response = await apiClient.get('/api/students');
        setStudents(response.data);
        // Cache for offline access
        OfflineStorage.set('students_list', response.data);
      } else {
        // Load from cache when offline
        const cached = OfflineStorage.get<Student[]>('students_list');
        if (cached) {
          setStudents(cached);
        }
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      // Try loading from cache on error
      const cached = OfflineStorage.get<Student[]>('students_list');
      if (cached) {
        setStudents(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (data: any[]) => {
    const response = await apiClient.post('/api/students/import', { students: data });
    await loadStudents();
    return response.data;
  };

  const columns = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'department', label: 'Department' },
    { key: 'level', label: 'Level' },
    {
      key: 'enrollment_status',
      label: 'Status',
      render: (student: Student) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            student.enrollment_status === 'active'
              ? 'bg-green-100 text-green-800'
              : student.enrollment_status === 'suspended'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {student.enrollment_status}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DEAN']}>
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
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              disabled={!isOnline}
            >
              {showUpload ? 'Hide Upload' : 'Import CSV'}
            </button>
          </div>

          {showUpload && (
            <div className="mb-6">
              <CSVUpload
                title="Import Students from CSV"
                expectedHeaders={['student_id', 'first_name', 'last_name', 'faculty', 'department', 'level', 'enrollment_status']}
                onUpload={handleCSVUpload}
              />
            </div>
          )}

          <DataTable
            data={students}
            columns={columns}
            loading={loading}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
