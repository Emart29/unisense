'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { apiClient } from '@/lib/api-client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiskStudent {
  student_id: string;
  student_name: string;
  risk_level: string;
  risk_score: number;
}

interface EnrollmentTrend {
  period: string;
  count: number;
}

interface DepartmentPerformance {
  department: string;
  average_gpa: number;
  pass_rate: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [atRiskStudents, setAtRiskStudents] = useState<RiskStudent[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrend[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [riskResponse, trendsResponse, perfResponse] = await Promise.all([
        apiClient.get('/api/ai/at-risk-students'),
        apiClient.get('/api/ai/enrollment-trends'),
        apiClient.get('/api/ai/department-performance'),
      ]);

      setAtRiskStudents(riskResponse.data);
      setEnrollmentTrends(trendsResponse.data);
      setDepartmentPerformance(perfResponse.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'DEAN']}>
        <Layout>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DEAN']}>
      <Layout>
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

          {/* At-Risk Students */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">At-Risk Students</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {atRiskStudents.map((student) => (
                    <tr key={student.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            student.risk_level === 'High'
                              ? 'bg-red-100 text-red-800'
                              : student.risk_level === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {student.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.risk_score.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enrollment Trends */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Enrollment Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#2563eb" name="Enrollments" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Department Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Department Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average_gpa" fill="#2563eb" name="Average GPA" />
                <Bar dataKey="pass_rate" fill="#10b981" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
