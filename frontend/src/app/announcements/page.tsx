'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_roles: string[];
  created_at: string;
  created_by: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_roles: [] as string[],
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await apiClient.get('/api/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/api/announcements', formData);
      setFormData({ title: '', content: '', target_roles: [] });
      setShowForm(false);
      await loadAnnouncements();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create announcement');
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  const roles = ['ADMIN', 'DEAN', 'LECTURER', 'STUDENT', 'FINANCE'];

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {showForm ? 'Cancel' : 'New Announcement'}
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          formData.target_roles.includes(role)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Create Announcement
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {announcement.title}
                </h3>
                <p className="text-gray-700 mb-4">{announcement.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex flex-wrap gap-2">
                    {announcement.target_roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
