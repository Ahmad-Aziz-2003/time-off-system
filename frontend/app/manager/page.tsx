'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManagerTable } from '@/components/ManagerTable';
import { Navbar } from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useLeaveStore } from '@/store/leaveStore';
import { UserRole } from '@/types';

export default function ManagerPage() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const { pendingRequests, isLoading, fetchPendingAll, approveRequest } = useLeaveStore();

  useEffect(() => {
    if (!employee) {
      router.replace('/login');
      return;
    }

    if (employee.role !== UserRole.MANAGER) {
      router.replace('/dashboard');
      return;
    }

    void fetchPendingAll();
  }, [employee, fetchPendingAll, router]);

  if (!employee) return null;

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>

        {isLoading && !pendingRequests.length ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <ManagerTable
            requests={pendingRequests}
            managerId={employee.id}
            onAction={approveRequest}
          />
        )}
      </div>
    </main>
  );
}
