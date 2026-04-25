'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LeaveRequestForm } from '@/components/LeaveRequestForm';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useLeaveStore } from '@/store/leaveStore';
import { UserRole } from '@/types';

export default function RequestPage() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const { balance, isLoading, fetchBalance, submitRequest } = useLeaveStore();

  useEffect(() => {
    if (!employee) {
      router.replace('/login');
      return;
    }

    if (employee.role !== UserRole.EMPLOYEE) {
      router.replace('/manager');
      return;
    }

    void fetchBalance(employee.id);
  }, [employee, fetchBalance, router]);

  if (!employee) return null;

  const onSubmit = async (payload: { daysRequested: number; reason: string }) => {
    try {
      await submitRequest({
        employeeId: employee.id,
        locationId: employee.locationId,
        daysRequested: payload.daysRequested,
        reason: payload.reason,
      });
      router.replace('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      toast.error(message);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <Card className="mb-4">
          <CardContent className="pt-6">
            {isLoading && !balance ? (
              <Skeleton className="h-6 w-60" />
            ) : (
              <p className="text-sm text-zinc-300">Current available balance: {balance?.availableDays ?? 0} days</p>
            )}
          </CardContent>
        </Card>

        {balance ? <LeaveRequestForm availableDays={balance.availableDays} onSubmit={onSubmit} /> : null}
      </div>
    </main>
  );
}
