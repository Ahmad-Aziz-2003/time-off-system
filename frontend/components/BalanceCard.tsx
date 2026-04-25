'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaveBalance } from '@/types';

type BalanceCardProps = {
  balance: LeaveBalance | null;
  loading: boolean;
  syncing: boolean;
  onForceSync: () => void;
};

export function BalanceCard({ balance, loading, syncing, onForceSync }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Balance</CardTitle>
        <Button onClick={onForceSync} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Force Sync'}
        </Button>
      </CardHeader>

      <CardContent>
        {loading || !balance ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-4xl font-bold text-accent">{balance.availableDays}</p>
            <p className="text-sm text-zinc-300">Used: {balance.usedDays} days</p>
            <p className="text-sm text-zinc-300">Total: {balance.totalDays} days</p>
            <p className="text-sm text-zinc-400">
              Last synced: {new Date(balance.lastSyncedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
