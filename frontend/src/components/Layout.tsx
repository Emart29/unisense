'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = getNavigationForRole(user?.role || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">UniSense</h1>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function getNavigationForRole(role: string) {
  const navMap: Record<string, Array<{ name: string; href: string }>> = {
    ADMIN: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Students', href: '/students' },
      { name: 'Courses', href: '/courses' },
      { name: 'Fees', href: '/fees' },
      { name: 'Announcements', href: '/announcements' },
      { name: 'Analytics', href: '/analytics' },
    ],
    DEAN: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Courses', href: '/courses' },
      { name: 'Students', href: '/students' },
    ],
    LECTURER: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Courses', href: '/courses' },
      { name: 'Grades', href: '/grades' },
    ],
    STUDENT: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Grades', href: '/grades' },
      { name: 'Register Courses', href: '/courses' },
      { name: 'Fees', href: '/fees' },
    ],
    FINANCE: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Fee Management', href: '/fees' },
      { name: 'Reports', href: '/reports' },
    ],
  };

  return navMap[role] || [];
}
