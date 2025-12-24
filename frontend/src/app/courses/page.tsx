'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { DataTable } from '@/components/DataTable';
import { apiClient } from '@/lib/api-client';
import { OfflineStorage } from '@/lib/offline-storage';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  id: string;
  course_code: string;
  title: string;
  credit_units: number;
  faculty: string;
  department: string;
  level: number;
  session: string;
  semester: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadCourses();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCourses = async () => {
    try {
      if (OfflineStorage.isOnline()) {
        const response = await apiClient.get('/api/courses');
        setCourses(response.data);
        OfflineStorage.cacheCourses(response.data);
      } else {
        const cached = OfflineStorage.getCachedCourses();
        if (cached) {
          setCourses(cached);
        }
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      const cached = OfflineStorage.getCachedCourses();
      if (cached) {
        setCourses(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCourse = async (course: Course) => {
    if (!isOnline) {
      alert('You must be online to register for courses');
      return;
    }

    setRegistering(true);
    try {
      await apiClient.post('/api/course-registrations', {
        course_id: course.id,
      });
      alert('Successfully registered for course');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to register for course');
    } finally {
      setRegistering(false);
    }
  };

  const columns = [
    { key: 'course_code', label: 'Code' },
    { key: 'title', label: 'Title' },
    { key: 'credit_units', label: 'Credits' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'department', label: 'Department' },
    { key: 'level', label: 'Level' },
    { key: 'session', label: 'Session' },
    { key: 'semester', label: 'Semester' },
  ];

  if (user?.role === 'STUDENT') {
    columns.push({
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (course: Course) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRegisterCourse(course);
          }}
          disabled={registering || !isOnline}
          className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Register
        </button>
      ),
    } as any);
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-0">
          {!isOnline && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                You are offline. Viewing cached data.
              </p>
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {user?.role === 'STUDENT' ? 'Course Registration' : 'Courses'}
          </h1>

          <DataTable
            data={courses}
            columns={columns}
            loading={loading}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
