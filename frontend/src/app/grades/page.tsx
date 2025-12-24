'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { DataTable } from '@/components/DataTable';
import { apiClient } from '@/lib/api-client';
import { OfflineStorage } from '@/lib/offline-storage';
import { useAuth } from '@/contexts/AuthContext';

interface Grade {
  id: string;
  course_code: string;
  course_title: string;
  score: number;
  letter_grade: string;
  grade_point: number;
  is_published: boolean;
}

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [gpa, setGpa] = useState<number | null>(null);
  const [cgpa, setCgpa] = useState<number | null>(null);

  useEffect(() => {
    loadGrades();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadGrades = async () => {
    try {
      if (OfflineStorage.isOnline()) {
        const response = await apiClient.get(`/api/grades/student/${user?.id}`);
        setGrades(response.data.grades || []);
        setGpa(response.data.gpa);
        setCgpa(response.data.cgpa);
        
        // Cache for offline access
        if (user?.id) {
          OfflineStorage.cacheGrades(user.id, response.data.grades || []);
        }
      } else {
        // Load from cache when offline
        if (user?.id) {
          const cached = OfflineStorage.getCachedGrades(user.id);
          if (cached) {
            setGrades(cached);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load grades:', error);
      // Try loading from cache on error
      if (user?.id) {
        const cached = OfflineStorage.getCachedGrades(user.id);
        if (cached) {
          setGrades(cached);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'course_code', label: 'Course Code' },
    { key: 'course_title', label: 'Course Title' },
    { key: 'score', label: 'Score' },
    { key: 'letter_grade', label: 'Grade' },
    { key: 'grade_point', label: 'Grade Point' },
    {
      key: 'is_published',
      label: 'Status',
      render: (grade: Grade) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            grade.is_published
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {grade.is_published ? 'Published' : 'Pending'}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'LECTURER']}>
      <Layout>
        <div className="px-4 sm:px-0">
          {!isOnline && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                You are offline. Viewing cached data.
              </p>
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Grades</h1>

          {user?.role === 'STUDENT' && (gpa !== null || cgpa !== null) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {gpa !== null && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Current GPA</h3>
                  <p className="mt-2 text-3xl font-bold text-primary-600">
                    {gpa.toFixed(2)}
                  </p>
                </div>
              )}
              {cgpa !== null && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">CGPA</h3>
                  <p className="mt-2 text-3xl font-bold text-primary-600">
                    {cgpa.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DataTable
            data={grades.filter(g => user?.role === 'STUDENT' ? g.is_published : true)}
            columns={columns}
            loading={loading}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
