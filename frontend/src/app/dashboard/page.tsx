'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to UniSense Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Role: <span className="font-semibold">{user?.role}</span>
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user?.role === 'ADMIN' && (
                  <>
                    <DashboardCard title="Students" href="/students" description="Manage student profiles" />
                    <DashboardCard title="Courses" href="/courses" description="Manage courses" />
                    <DashboardCard title="Fees" href="/fees" description="Fee management" />
                    <DashboardCard title="Announcements" href="/announcements" description="Create announcements" />
                    <DashboardCard title="Analytics" href="/analytics" description="View insights" />
                  </>
                )}
                {user?.role === 'DEAN' && (
                  <>
                    <DashboardCard title="Courses" href="/courses" description="Manage courses" />
                    <DashboardCard title="Students" href="/students" description="View students" />
                    <DashboardCard title="Analytics" href="/analytics" description="View insights" />
                  </>
                )}
                {user?.role === 'LECTURER' && (
                  <>
                    <DashboardCard title="My Courses" href="/courses" description="View your courses" />
                    <DashboardCard title="Grades" href="/grades" description="Enter grades" />
                  </>
                )}
                {user?.role === 'STUDENT' && (
                  <>
                    <DashboardCard title="My Grades" href="/grades" description="View your grades" />
                    <DashboardCard title="Course Registration" href="/courses" description="Register for courses" />
                    <DashboardCard title="Fees" href="/fees" description="View fee status" />
                  </>
                )}
                {user?.role === 'FINANCE' && (
                  <>
                    <DashboardCard title="Fee Management" href="/fees" description="Manage fees" />
                    <DashboardCard title="Reports" href="/reports" description="Financial reports" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

function DashboardCard({ title, href, description }: { title: string; href: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
    >
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
