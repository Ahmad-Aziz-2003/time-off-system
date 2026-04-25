'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BalanceCard } from '@/components/BalanceCard';
import { Navbar } from '@/components/Navbar';
import { NetworkWarningBanner } from '@/components/NetworkWarningBanner';
import { RequestCard } from '@/components/RequestCard';
import { SyncIndicator } from '@/components/SyncIndicator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useLeaveStore } from '@/store/leaveStore';
import { UserRole } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);

  const {
    balance,
    requests,
    isLoading,
    isSyncingBalance,
    networkWarning,
    fetchBalance,
    fetchMyRequests,
    forceSyncBalance,
    cancelRequest,
  } = useLeaveStore();

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
    void fetchMyRequests(employee.id);

    const interval = setInterval(() => {
      void fetchBalance(employee.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [employee, fetchBalance, fetchMyRequests, router]);

  if (!employee) return null;

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Hello, {employee.name}</h1>
          <SyncIndicator lastSyncedAt={balance?.lastSyncedAt ?? null} isSyncing={isSyncingBalance} />
        </div>

        {networkWarning && <NetworkWarningBanner message={networkWarning} />}

        <BalanceCard
          balance={balance}
          loading={isLoading && !balance}
          syncing={isSyncingBalance}
          onForceSync={() => void forceSyncBalance(employee.id)}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Requests</h2>
          <Link href="/request">
            <Button>Request Leave</Button>
          </Link>
        </div>

        {isLoading && !requests.length ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : requests.length ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} onCancel={(requestId) => void cancelRequest(requestId)} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-zinc-400">No requests found</p>
        )}
      </div>
    </main>
  );
}
