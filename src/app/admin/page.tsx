'use client';

import { AdminDashboardPage } from '@/views/AdminDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { hasAdminAccess, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else if (!hasAdminAccess()) {
      router.push('/');
    }
  }, [hasAdminAccess, isAuthenticated, router]);

  const handleNavigate = (page: string) => {
    if (page === 'login') {
      router.push('/login');
    } else if (page === 'home') {
      router.push('/');
    }
  };

  if (!hasAdminAccess()) {
    return null;
  }

  return <AdminDashboardPage onNavigate={handleNavigate} />;
}
