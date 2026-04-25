'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const employee = useAuthStore((state) => state.employee);

  useEffect(() => {
    if (!isAuthenticated || !employee) {
      router.replace('/login');
      return;
    }

    if (employee.role === UserRole.MANAGER) {
      router.replace('/manager');
      return;
    }

    router.replace('/dashboard');
  }, [employee, isAuthenticated, router]);

  return <div className="flex min-h-screen items-center justify-center text-zinc-400">Redirecting...</div>;
}
